import getDb from '../db/index.js';

// Cache Google Books API or Open Library search results into SQLite/Postgres books table
export async function searchBooksOnline(query, options = {}) {
  const { filterType = 'all', maxResults = 20 } = options;
  const db = getDb();

  // 1. Try Google Books API first
  try {
    let formattedQuery = query;
    if (filterType === 'title') formattedQuery = `intitle:${query}`;
    else if (filterType === 'author') formattedQuery = `inauthor:${query}`;
    else if (filterType === 'isbn') formattedQuery = `isbn:${query}`;
    else if (filterType === 'genre') formattedQuery = `subject:${query}`;

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(formattedQuery)}&maxResults=${maxResults}&printType=books`;
    const response = await fetch(url, { headers: { 'User-Agent': 'RAAVE-App/1.0' } });
    
    if (response.ok) {
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return processGoogleBooksItems(data.items, db);
      }
    } else {
      console.warn(`Google Books API status ${response.status}. Switching to Open Library API fallback.`);
    }
  } catch (err) {
    console.warn('Google Books failed:', err.message, 'switching to Open Library.');
  }

  // 2. Open Library API Fallback
  try {
    let olQuery = `q=${encodeURIComponent(query)}`;
    if (filterType === 'title') olQuery = `title=${encodeURIComponent(query)}`;
    else if (filterType === 'author') olQuery = `author=${encodeURIComponent(query)}`;
    else if (filterType === 'isbn') olQuery = `isbn=${encodeURIComponent(query)}`;
    else if (filterType === 'genre') olQuery = `subject=${encodeURIComponent(query)}`;

    const olUrl = `https://openlibrary.org/search.json?${olQuery}&limit=${maxResults}`;
    const olResponse = await fetch(olUrl, { headers: { 'User-Agent': 'RAAVE-App/1.0' } });

    if (olResponse.ok) {
      const olData = await olResponse.json();
      if (olData.docs && olData.docs.length > 0) {
        return processOpenLibraryDocs(olData.docs, db);
      }
    }
  } catch (olErr) {
    console.warn('Open Library API also failed:', olErr.message);
  }

  // 3. Fallback to local database search
  return searchLocalBooks(query, filterType);
}

function processGoogleBooksItems(items, db) {
  const upsertBook = db.prepare(`
    INSERT INTO books (id, isbn, title, author, description, cover_url, publisher, published_date, genre, categories, page_count, average_rating, ratings_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      description = excluded.description,
      cover_url = COALESCE(books.cover_url, excluded.cover_url),
      page_count = CASE WHEN books.page_count = 0 THEN excluded.page_count ELSE books.page_count END,
      average_rating = CASE WHEN excluded.average_rating > 0 THEN excluded.average_rating ELSE books.average_rating END,
      ratings_count = CASE WHEN excluded.ratings_count > 0 THEN excluded.ratings_count ELSE books.ratings_count END
  `);

  const results = [];

  for (const item of items) {
    const info = item.volumeInfo || {};
    const id = item.id;
    const title = info.title || 'Untitled';
    const authors = (info.authors && info.authors.length > 0) ? info.authors.join(', ') : 'Unknown Author';
    const description = info.description || 'No description available.';

    let coverUrl = null;
    if (info.imageLinks) {
      coverUrl = info.imageLinks.extraLarge || 
                 info.imageLinks.large || 
                 info.imageLinks.medium || 
                 info.imageLinks.thumbnail || 
                 info.imageLinks.smallThumbnail;
      if (coverUrl && coverUrl.startsWith('http://')) {
        coverUrl = coverUrl.replace('http://', 'https://');
      }
    }

    const isbn = info.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier || 
                 info.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier || null;

    if (!coverUrl && isbn) {
      coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
    }

    const publisher = info.publisher || 'Independent';
    const publishedDate = info.publishedDate || 'Unknown';
    const genre = (info.categories && info.categories.length > 0) ? info.categories[0] : 'General';
    const categories = JSON.stringify(info.categories || ['General']);
    const pageCount = info.pageCount || 320;
    const avgRating = info.averageRating || 0;
    const ratingsCount = info.ratingsCount || 0;

    try {
      upsertBook.run(id, isbn, title, authors, description, coverUrl, publisher, publishedDate, genre, categories, pageCount, avgRating, ratingsCount);
    } catch (_) {}

    results.push({
      id,
      isbn,
      title,
      author: authors,
      description,
      cover_url: coverUrl,
      publisher,
      published_date: publishedDate,
      genre,
      categories: JSON.parse(categories),
      page_count: pageCount,
      average_rating: avgRating,
      ratings_count: ratingsCount
    });
  }

  return results;
}

function processOpenLibraryDocs(docs, db) {
  const upsertBook = db.prepare(`
    INSERT INTO books (id, isbn, title, author, description, cover_url, publisher, published_date, genre, categories, page_count, average_rating, ratings_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      cover_url = COALESCE(books.cover_url, excluded.cover_url),
      page_count = CASE WHEN books.page_count = 0 THEN excluded.page_count ELSE books.page_count END
  `);

  const results = [];

  for (const doc of docs) {
    const rawKey = doc.key ? doc.key.replace('/works/', '') : `ol_${Math.abs(doc.title.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`;
    const id = `ol_${rawKey}`;
    const title = doc.title || 'Untitled';
    const authors = doc.author_name ? doc.author_name.slice(0, 2).join(', ') : 'Unknown Author';
    const isbn = doc.isbn ? doc.isbn[0] : null;

    let coverUrl = null;
    if (doc.cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    } else if (isbn) {
      coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    }

    const publisher = doc.publisher ? doc.publisher[0] : 'Open Library Publication';
    const publishedDate = doc.first_publish_year ? String(doc.first_publish_year) : 'Unknown';
    const genre = (doc.subject && doc.subject.length > 0) ? doc.subject[0] : 'General';
    const categories = JSON.stringify(doc.subject ? doc.subject.slice(0, 4) : ['General']);
    const pageCount = doc.number_of_pages_median || 350;
    const avgRating = doc.ratings_average ? Math.round(doc.ratings_average * 100) / 100 : 0;
    const ratingsCount = doc.ratings_count || 0;
    const description = `Acclaimed work by ${authors}, first published in ${publishedDate}. A celebrated entry in ${genre} literature.`;

    try {
      upsertBook.run(id, isbn, title, authors, description, coverUrl, publisher, publishedDate, genre, categories, pageCount, avgRating, ratingsCount);
    } catch (_) {}

    results.push({
      id,
      isbn,
      title,
      author: authors,
      description,
      cover_url: coverUrl,
      publisher,
      published_date: publishedDate,
      genre,
      categories: JSON.parse(categories),
      page_count: pageCount,
      average_rating: avgRating,
      ratings_count: ratingsCount
    });
  }

  return results;
}

export function searchLocalBooks(query, filterType = 'all') {
  const db = getDb();
  let sql = 'SELECT * FROM books WHERE ';
  const term = `%${query}%`;

  if (filterType === 'title') {
    sql += 'title LIKE ?';
  } else if (filterType === 'author') {
    sql += 'author LIKE ?';
  } else if (filterType === 'isbn') {
    sql += 'isbn LIKE ?';
  } else if (filterType === 'genre') {
    sql += 'genre LIKE ? OR categories LIKE ?';
    return db.prepare(sql).all(term, term).map(parseBook);
  } else {
    sql += 'title LIKE ? OR author LIKE ? OR genre LIKE ? OR description LIKE ?';
    return db.prepare(sql).all(term, term, term, term).map(parseBook);
  }

  return db.prepare(sql).all(term).map(parseBook);
}

export function parseBook(book) {
  if (!book) return null;
  return {
    ...book,
    categories: typeof book.categories === 'string' ? JSON.parse(book.categories || '[]') : book.categories
  };
}

/**
 * Fetch live rating, ratingsCount, and Google Books infoLink for a book.
 * Falls back gracefully if Google Books is rate-limited or unreachable.
 */
export async function fetchGoogleBooksRatingAndLink(book) {
  if (!book) return null;

  const isGoogleVolumeId = book.id && !book.id.startsWith('book_') && !book.id.startsWith('ol_');
  const queries = [];

  if (isGoogleVolumeId) {
    queries.push(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(book.id)}`);
  }
  if (book.isbn) {
    queries.push(`https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(book.isbn)}&maxResults=1`);
  }
  if (book.title) {
    const q = book.author ? `intitle:${book.title} inauthor:${book.author}` : `intitle:${book.title}`;
    queries.push(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1`);
  }

  for (const url of queries) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'RAAVE-App/1.0' },
        signal: AbortSignal.timeout(2500)
      });
      if (!response.ok) continue;

      const data = await response.json();
      const volume = data.volumeInfo ? data : data.items?.[0];
      const info = volume?.volumeInfo;
      if (!info) continue;

      const googleRating = info.averageRating || null;
      const googleRatingsCount = info.ratingsCount || null;
      const googleBooksUrl = info.infoLink || info.previewLink || (volume.id ? `https://books.google.com/books?id=${volume.id}` : null);

      if (googleRating || googleRatingsCount) {
        const db = getDb();
        db.prepare(`
          UPDATE books
          SET average_rating = COALESCE(?, average_rating),
              ratings_count = COALESCE(?, ratings_count)
          WHERE id = ?
        `).run(googleRating, googleRatingsCount, book.id);
      }

      return {
        google_rating: googleRating,
        google_ratings_count: googleRatingsCount,
        google_books_url: googleBooksUrl
      };
    } catch (_) {
      // Try next query or fail gracefully
    }
  }

  return null;
}
