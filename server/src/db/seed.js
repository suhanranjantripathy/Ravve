import { initDatabase } from './schema.js';

export function seedDatabase(db) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('🌱 Seeding RAAVE database with rich community and book data...');

  const insertProfile = db.prepare(`
    INSERT INTO profiles (id, username, full_name, avatar_url, bio, reading_interests, favorite_genres, favorite_books, favorite_authors, currently_reading_status, reading_streak_days, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBook = db.prepare(`
    INSERT INTO books (id, isbn, title, author, description, cover_url, publisher, published_date, genre, categories, page_count, average_rating, ratings_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertShelf = db.prepare(`
    INSERT INTO shelves (id, user_id, name, slug, description, is_public, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUserBook = db.prepare(`
    INSERT INTO user_books (id, user_id, book_id, shelf_type, custom_shelf_id, current_page, total_pages, user_rating, start_date, finish_date, personal_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (id, user_id, book_id, rating, title, content, has_spoilers, likes_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReviewLike = db.prepare(`
    INSERT INTO review_likes (id, user_id, review_id)
    VALUES (?, ?, ?)
  `);

  const insertComment = db.prepare(`
    INSERT INTO comments (id, user_id, review_id, parent_comment_id, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertFollow = db.prepare(`
    INSERT INTO follows (id, follower_id, following_id)
    VALUES (?, ?, ?)
  `);

  const insertActivity = db.prepare(`
    INSERT INTO activity_feed (id, user_id, action_type, book_id, review_id, details, likes_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGoal = db.prepare(`
    INSERT INTO reading_goals (id, user_id, year, target_books, completed_books)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertSession = db.prepare(`
    INSERT INTO reading_sessions (id, user_id, book_id, date, duration_minutes, pages_read, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertJournal = db.prepare(`
    INSERT INTO journal_entries (id, user_id, book_id, title, content, favorite_quotes, tags, is_private)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Run everything inside an atomic transaction
  const seedTransaction = db.transaction(() => {
    // 1. PROFILES
    const users = [
      {
        id: 'usr_elena',
        username: 'elena_reads',
        full_name: 'Elena Rostova',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        bio: 'Devouring speculative fiction, philosophy, and translated literature. Searching for prose that echoes.',
        interests: JSON.stringify(['Hard Sci-Fi', 'Existentialism', 'Magical Realism']),
        genres: JSON.stringify(['Science Fiction', 'Philosophy', 'Literary Fiction', 'Fantasy']),
        books: JSON.stringify(['book_dune', 'book_three_body', 'book_klara', 'book_meditations']),
        authors: JSON.stringify(['Frank Herbert', 'Liu Cixin', 'Kazuo Ishiguro', 'Ursula K. Le Guin']),
        current_status: 'Deep into Children of Time',
        streak: 18,
        is_public: 1
      },
      {
        id: 'usr_marcus',
        username: 'marcus_aurelius_club',
        full_name: 'Marcus Vance',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
        bio: 'Stoic philosophy, ancient history, and systemic thinking. Annotating physical margins.',
        interests: JSON.stringify(['Stoicism', 'Ancient Rome', 'Complexity Theory']),
        genres: JSON.stringify(['Philosophy', 'History', 'Non-Fiction']),
        books: JSON.stringify(['book_meditations', 'book_sapiens', 'book_thinking_fast']),
        authors: JSON.stringify(['Marcus Aurelius', 'Seneca', 'Daniel Kahneman']),
        current_status: 'Rereading Letters from a Stoic',
        streak: 34,
        is_public: 1
      },
      {
        id: 'usr_sophia',
        username: 'sophia_reads',
        full_name: 'Sophia Chen',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
        bio: 'Software engineer by day, bibliophile by night. Cozy mysteries, high fantasy, and AI ethics.',
        interests: JSON.stringify(['High Fantasy', 'Cyberpunk', 'Graphic Novels']),
        genres: JSON.stringify(['Fantasy', 'Science Fiction', 'Mystery']),
        books: JSON.stringify(['book_name_of_wind', 'book_project_hail_mary', 'book_piranesi']),
        authors: JSON.stringify(['Patrick Rothfuss', 'Andy Weir', 'Susanna Clarke']),
        current_status: 'Captivated by Piranesi',
        streak: 9,
        is_public: 1
      },
      {
        id: 'usr_alex',
        username: 'alex_wright',
        full_name: 'Alex Wright',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
        bio: 'Narrative non-fiction, psychology, and behavioral economics. Track every page read.',
        interests: JSON.stringify(['Psychology', 'Biographies', 'Productivity']),
        genres: JSON.stringify(['Non-Fiction', 'Psychology', 'Biography']),
        books: JSON.stringify(['book_atomic_habits', 'book_sapiens', 'book_steve_jobs']),
        authors: JSON.stringify(['James Clear', 'Walter Isaacson', 'Malcolm Gladwell']),
        current_status: 'Practicing Atomic Habits chapter 7',
        streak: 42,
        is_public: 1
      }
    ];

    for (const u of users) {
      insertProfile.run(u.id, u.username, u.full_name, u.avatar_url, u.bio, u.interests, u.genres, u.books, u.authors, u.current_status, u.streak, u.is_public);
    }

    // 2. BOOKS (20 rich books with realistic covers, pages, ratings, ISBNs)
    const books = [
      {
        id: 'book_dune',
        isbn: '9780441013593',
        title: 'Dune',
        author: 'Frank Herbert',
        description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only valuable commodity is "spice", a drug capable of extending life and enhancing consciousness.',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg',
        publisher: 'Ace Books',
        published_date: '1965-08-01',
        genre: 'Science Fiction',
        categories: JSON.stringify(['Science Fiction', 'Space Opera', 'Classics']),
        page_count: 688,
        average_rating: 4.26,
        ratings_count: 1240
      },
      {
        id: 'book_project_hail_mary',
        isbn: '9780593135204',
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        description: 'Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself are doomed. Except right now, he doesn\'t know that. He can\'t even remember his own name, let alone the nature of his assignment.',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1597695864i/54493401.jpg',
        publisher: 'Ballantine Books',
        published_date: '2021-05-04',
        genre: 'Science Fiction',
        categories: JSON.stringify(['Science Fiction', 'Space Exploration', 'Humor']),
        page_count: 496,
        average_rating: 4.52,
        ratings_count: 980
      },
      {
        id: 'book_three_body',
        isbn: '9780765382030',
        title: 'The Three-Body Problem',
        author: 'Liu Cixin',
        description: 'Set against the backdrop of China\'s Cultural Revolution, a secret military project sends signals into space to establish contact with aliens. An alien civilization on the brink of destruction captures the signal and plans to invade Earth.',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1415438224i/20518872.jpg',
        publisher: 'Tor Books',
        published_date: '2008-01-01',
        genre: 'Science Fiction',
        categories: JSON.stringify(['Science Fiction', 'Hard Sci-Fi', 'Translation']),
        page_count: 400,
        average_rating: 4.08,
        ratings_count: 820
      },
      {
        id: 'book_klara',
        isbn: '9780593318294',
        title: 'Klara and the Sun',
        author: 'Kazuo Ishiguro',
        description: 'From the Nobel Prize-winning author of Never Let Me Go, a magnificent new novel that asks the question: What does it mean to love? Klara, an Artificial Friend with outstanding observational qualities, watches carefully the behavior of those who come in to browse.',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1603206535i/54120408.jpg',
        publisher: 'Knopf',
        published_date: '2021-03-02',
        genre: 'Literary Fiction',
        categories: JSON.stringify(['Literary Fiction', 'Sci-Fi', 'Dystopian']),
        page_count: 320,
        average_rating: 3.78,
        ratings_count: 650
      },
      {
        id: 'book_piranesi',
        isbn: '9781635575637',
        title: 'Piranesi',
        author: 'Susanna Clarke',
        description: 'Piranesi\'s house is no ordinary building: its rooms are infinite, its corridors endless, its walls lined with thousands upon thousands of statues. Within the labyrinth of halls an ocean is imprisoned; waves thunder up staircases, rooms are flooded in an instant.',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1589642441i/50202953.jpg',
        publisher: 'Bloomsbury',
        published_date: '2020-09-15',
        genre: 'Fantasy',
        categories: JSON.stringify(['Fantasy', 'Mystery', 'Magical Realism']),
        page_count: 272,
        average_rating: 4.25,
        ratings_count: 730
      },
      {
        id: 'book_atomic_habits',
        isbn: '9780735211292',
        title: 'Atomic Habits',
        author: 'James Clear',
        description: 'No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world\'s leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits and break bad ones.',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg',
        publisher: 'Avery',
        published_date: '2018-10-16',
        genre: 'Self-Help',
        categories: JSON.stringify(['Non-Fiction', 'Psychology', 'Self-Help', 'Productivity']),
        page_count: 320,
        average_rating: 4.38,
        ratings_count: 2100
      },
      {
        id: 'book_meditations',
        isbn: '9780140449334',
        title: 'Meditations',
        author: 'Marcus Aurelius',
        description: 'Written in Greek without any intention of publication, the Meditations of Marcus Aurelius offer a remarkable series of challenging spiritual reflections and exercises developed as the emperor struggled to understand himself and make sense of the universe.',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1421618636i/30659.jpg',
        publisher: 'Penguin Classics',
        published_date: '0180-01-01',
        genre: 'Philosophy',
        categories: JSON.stringify(['Philosophy', 'Classics', 'Stoicism', 'Ancient']),
        page_count: 256,
        average_rating: 4.23,
        ratings_count: 1540
      },
      {
        id: 'book_sapiens',
        isbn: '9780062316097',
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        description: '100,000 years ago, at least six human species inhabited the earth. Today there is just one. Us. Homo sapiens. How did our species succeed in the battle for dominance? Why did our foraging ancestors come together to create cities and kingdoms?',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1700188665i/23692271.jpg',
        publisher: 'Harper',
        published_date: '2014-09-04',
        genre: 'History',
        categories: JSON.stringify(['Non-Fiction', 'History', 'Anthropology']),
        page_count: 464,
        average_rating: 4.37,
        ratings_count: 1890
      },
      {
        id: 'book_name_of_wind',
        isbn: '9780756404741',
        title: 'The Name of the Wind',
        author: 'Patrick Rothfuss',
        description: 'Told in Kvothe\'s own voice, this is the tale of the magically gifted young man who grows to be the most notorious wizard his world has ever seen. The intimate screen of his childhood in a troupe of traveling players, the years spent as a near-feral orphan in a crime-riddled city.',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1270352123i/186074.jpg',
        publisher: 'DAW Books',
        published_date: '2007-03-27',
        genre: 'Fantasy',
        categories: JSON.stringify(['Fantasy', 'Epic Fantasy', 'Magic']),
        page_count: 662,
        average_rating: 4.51,
        ratings_count: 1450
      },
      {
        id: 'book_tomorrow',
        isbn: '9780593321201',
        title: 'Tomorrow, and Tomorrow, and Tomorrow',
        author: 'Gabrielle Zevin',
        description: 'On a bitter-cold day, in the December of his junior year at Harvard, Sam Masur exits a subway car and sees, amid the hordes of people waiting on the platform, Sadie Green. He calls her name. For a moment, she pretends not to hear him, but then she turns, and a game begins.',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1636978687i/58784475.jpg',
        publisher: 'Knopf',
        published_date: '2022-07-05',
        genre: 'Literary Fiction',
        categories: JSON.stringify(['Literary Fiction', 'Video Games', 'Friendship']),
        page_count: 416,
        average_rating: 4.19,
        ratings_count: 890
      },
      {
        id: 'book_children_of_time',
        isbn: '9780316452502',
        title: 'Children of Time',
        author: 'Adrian Tchaikovsky',
        description: 'A race for survival among the stars... Humanity\'s last survivors escaped earth\'s destruction. Now they seek a terraformed world, but find it occupied by a new civilization engineered from an unexpected evolutionary experiment.',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1431014197i/25499718.jpg',
        publisher: 'Orbit',
        published_date: '2015-06-04',
        genre: 'Science Fiction',
        categories: JSON.stringify(['Science Fiction', 'Space Opera', 'Evolution']),
        page_count: 600,
        average_rating: 4.31,
        ratings_count: 520
      },
      {
        id: 'book_song_of_achilles',
        isbn: '9780062060624',
        title: 'The Song of Achilles',
        author: 'Madeline Miller',
        description: 'Greece in the age of heroes. Patroclus, an awkward young prince, has been exiled to the court of King Peleus and his perfect son Achilles. Despite their differences, Achilles befriends the shamed prince, and as they grow, their bond blossoms into something deeper.',
        cover_url: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1334408221i/11250317.jpg',
        publisher: 'Ecco',
        published_date: '2012-03-06',
        genre: 'Historical Fiction',
        categories: JSON.stringify(['Historical Fiction', 'Mythology', 'Romance']),
        page_count: 378,
        average_rating: 4.33,
        ratings_count: 1120
      }
    ];

    for (const b of books) {
      insertBook.run(b.id, b.isbn, b.title, b.author, b.description, b.cover_url, b.publisher, b.published_date, b.genre, b.categories, b.page_count, b.average_rating, b.ratings_count);
    }

    // 3. SHELVES
    const shelves = [
      { id: 'shf_elena_fav', user_id: 'usr_elena', name: 'All-Time Masterpieces', slug: 'all-time-masterpieces', description: 'Books that permanently altered my perception of reality', is_public: 1 },
      { id: 'shf_elena_scifi', user_id: 'usr_elena', name: 'Hard Sci-Fi Canon', slug: 'hard-sci-fi-canon', description: 'Rigorous physics, Fermi paradox, speculative futures', is_public: 1 },
      { id: 'shf_marcus_stoic', user_id: 'usr_marcus', name: 'Inner Citadel', slug: 'inner-citadel', description: 'Philosophical texts for resilience and calm', is_public: 1 },
      { id: 'shf_sophia_cozy', user_id: 'usr_sophia', name: 'Autumn Reads', slug: 'autumn-reads', description: 'Atmospheric and comforting pages', is_public: 1 }
    ];

    for (const s of shelves) {
      insertShelf.run(s.id, s.user_id, s.name, s.slug, s.description, s.is_public, 0);
    }

    // 4. USER_BOOKS (Progress, reading tracker, shelves)
    const userBooks = [
      // Elena
      { id: 'ub_1', user_id: 'usr_elena', book_id: 'book_children_of_time', shelf_type: 'currently_reading', custom_shelf_id: 'shf_elena_scifi', current_page: 384, total_pages: 600, user_rating: null, start_date: '2026-11-02', finish_date: null, notes: 'The evolutionary arcs of the Portia jumping spiders are mind-bending.' },
      { id: 'ub_2', user_id: 'usr_elena', book_id: 'book_dune', shelf_type: 'read', custom_shelf_id: 'shf_elena_fav', current_page: 688, total_pages: 688, user_rating: 5, start_date: '2026-09-10', finish_date: '2026-09-28', notes: 'Fear is the mind killer. A foundational masterwork.' },
      { id: 'ub_3', user_id: 'usr_elena', book_id: 'book_three_body', shelf_type: 'read', custom_shelf_id: 'shf_elena_scifi', current_page: 400, total_pages: 400, user_rating: 5, start_date: '2026-08-01', finish_date: '2026-08-16', notes: 'The cosmic sociology premise is unforgettable.' },
      { id: 'ub_4', user_id: 'usr_elena', book_id: 'book_project_hail_mary', shelf_type: 'read', custom_shelf_id: null, current_page: 496, total_pages: 496, user_rating: 5, start_date: '2026-07-01', finish_date: '2026-07-12', notes: 'Amaze! Rocky is the best deuteragonist in recent sci-fi.' },
      { id: 'ub_5', user_id: 'usr_elena', book_id: 'book_piranesi', shelf_type: 'want_to_read', custom_shelf_id: null, current_page: 0, total_pages: 272, user_rating: null, start_date: null, finish_date: null, notes: 'Recommended by Sophia Chen.' },
      { id: 'ub_6', user_id: 'usr_elena', book_id: 'book_tomorrow', shelf_type: 'want_to_read', custom_shelf_id: null, current_page: 0, total_pages: 416, user_rating: null, start_date: null, finish_date: null, notes: '' },
      
      // Marcus
      { id: 'ub_7', user_id: 'usr_marcus', book_id: 'book_meditations', shelf_type: 'read', custom_shelf_id: 'shf_marcus_stoic', current_page: 256, total_pages: 256, user_rating: 5, start_date: '2026-01-01', finish_date: '2026-01-20', notes: 'Read daily every morning.' },
      { id: 'ub_8', user_id: 'usr_marcus', book_id: 'book_sapiens', shelf_type: 'read', custom_shelf_id: null, current_page: 464, total_pages: 464, user_rating: 4, start_date: '2026-03-01', finish_date: '2026-03-24', notes: 'Broad cognitive revolution analysis.' },
      { id: 'ub_9', user_id: 'usr_marcus', book_id: 'book_atomic_habits', shelf_type: 'currently_reading', custom_shelf_id: null, current_page: 195, total_pages: 320, user_rating: null, start_date: '2026-11-10', finish_date: null, notes: 'Aligns closely with Epictetus on deliberate discipline.' },

      // Sophia
      { id: 'ub_10', user_id: 'usr_sophia', book_id: 'book_piranesi', shelf_type: 'currently_reading', custom_shelf_id: 'shf_sophia_cozy', current_page: 210, total_pages: 272, user_rating: null, start_date: '2026-11-14', finish_date: null, notes: 'The Beauty of the House is immeasurable; its Kindness infinite.' },
      { id: 'ub_11', user_id: 'usr_sophia', book_id: 'book_name_of_wind', shelf_type: 'read', custom_shelf_id: null, current_page: 662, total_pages: 662, user_rating: 5, start_date: '2026-05-01', finish_date: '2026-05-22', notes: 'The prose flows like music.' },

      // Alex
      { id: 'ub_12', user_id: 'usr_alex', book_id: 'book_atomic_habits', shelf_type: 'read', custom_shelf_id: null, current_page: 320, total_pages: 320, user_rating: 5, start_date: '2026-02-01', finish_date: '2026-02-14', notes: 'Implemented the 2-minute rule immediately.' }
    ];

    for (const ub of userBooks) {
      insertUserBook.run(ub.id, ub.user_id, ub.book_id, ub.shelf_type, ub.custom_shelf_id, ub.current_page, ub.total_pages, ub.user_rating, ub.start_date, ub.finish_date, ub.notes);
    }

    // 5. REVIEWS
    const reviews = [
      {
        id: 'rev_1',
        user_id: 'usr_elena',
        book_id: 'book_dune',
        rating: 5,
        title: 'An unassailable titan of ecological & philosophical sci-fi',
        content: 'Dune is not merely about space empires; it is a profound examination of ecology, religious fanaticism, and charismatic leadership. Herbert crafts a world so vivid that the desert heat radiates from every paragraph. The pacing is deliberate and hypnotic.',
        has_spoilers: 0,
        likes_count: 42,
        created_at: '2026-09-29 14:20:00'
      },
      {
        id: 'rev_2',
        user_id: 'usr_elena',
        book_id: 'book_project_hail_mary',
        rating: 5,
        title: 'Pure joy, optimism, and friendship across light years',
        content: 'Andy Weir strikes gold again. Ryland Grace and his extraterrestrial partner Rocky formulate one of the most heartwarming partnerships in modern literature. You will cheer out loud, hold your breath, and cry tears of scientific awe. Fist my bump!',
        has_spoilers: 0,
        likes_count: 38,
        created_at: '2026-07-13 18:45:00'
      },
      {
        id: 'rev_3',
        user_id: 'usr_marcus',
        book_id: 'book_meditations',
        rating: 5,
        title: 'The ultimate manual for living with equanimity',
        content: 'A Roman emperor sitting by candlelight during warfare, writing reminders to his own soul: "You have power over your mind - not outside events. Realize this, and you will find strength." Every generation must rediscover this book.',
        has_spoilers: 0,
        likes_count: 67,
        created_at: '2026-01-21 09:15:00'
      },
      {
        id: 'rev_4',
        user_id: 'usr_sophia',
        book_id: 'book_name_of_wind',
        rating: 5,
        title: 'A story of silence in three parts',
        content: 'Rothfuss treats sentences like musical compositions. The University, the Sympathy magic system, and Kvothe\'s melancholic voice in the Waystone Inn make this an instant comfort classic.',
        has_spoilers: 0,
        likes_count: 29,
        created_at: '2026-05-23 21:00:00'
      },
      {
        id: 'rev_5',
        user_id: 'usr_alex',
        book_id: 'book_atomic_habits',
        rating: 5,
        title: 'The clearest, most actionable guide to behavior change',
        content: 'You do not rise to the level of your goals, you fall to the level of your systems. Clear synthesizes psychology and behavioral economics into immediate daily habits.',
        has_spoilers: 0,
        likes_count: 51,
        created_at: '2026-02-15 11:30:00'
      }
    ];

    for (const r of reviews) {
      insertReview.run(r.id, r.user_id, r.book_id, r.rating, r.title, r.content, r.has_spoilers, r.likes_count, r.created_at);
    }

    // 6. REVIEW LIKES
    insertReviewLike.run('rl_1', 'usr_marcus', 'rev_1');
    insertReviewLike.run('rl_2', 'usr_sophia', 'rev_1');
    insertReviewLike.run('rl_3', 'usr_alex', 'rev_1');
    insertReviewLike.run('rl_4', 'usr_elena', 'rev_3');
    insertReviewLike.run('rl_5', 'usr_sophia', 'rev_3');
    insertReviewLike.run('rl_6', 'usr_elena', 'rev_4');

    // 7. COMMENTS
    insertComment.run('cmt_1', 'usr_marcus', 'rev_1', null, 'The ecological depth in Dune is staggering. Herbert was decades ahead of his time.', '2026-09-30 10:10:00');
    insertComment.run('cmt_2', 'usr_sophia', 'rev_2', null, 'Rocky is forever my favorite character! "Amaze, amaze, amaze!"', '2026-07-14 12:00:00');
    insertComment.run('cmt_3', 'usr_elena', 'rev_3', null, 'The Gregory Hays translation of Meditations in particular is sublime.', '2026-01-22 14:15:00');

    // 8. FOLLOWS
    insertFollow.run('flw_1', 'usr_elena', 'usr_marcus');
    insertFollow.run('flw_2', 'usr_elena', 'usr_sophia');
    insertFollow.run('flw_3', 'usr_marcus', 'usr_elena');
    insertFollow.run('flw_4', 'usr_sophia', 'usr_elena');
    insertFollow.run('flw_5', 'usr_alex', 'usr_elena');

    // 9. ACTIVITY FEED
    const activities = [
      { id: 'act_1', user_id: 'usr_elena', action_type: 'started_reading', book_id: 'book_children_of_time', review_id: null, details: JSON.stringify({ current_page: 384, total_pages: 600 }), likes: 14, created_at: '2026-11-20 16:30:00' },
      { id: 'act_2', user_id: 'usr_sophia', action_type: 'started_reading', book_id: 'book_piranesi', review_id: null, details: JSON.stringify({ current_page: 210, total_pages: 272 }), likes: 9, created_at: '2026-11-19 19:15:00' },
      { id: 'act_3', user_id: 'usr_marcus', action_type: 'added_to_shelf', book_id: 'book_atomic_habits', review_id: null, details: JSON.stringify({ shelf: 'currently_reading' }), likes: 5, created_at: '2026-11-18 11:00:00' },
      { id: 'act_4', user_id: 'usr_elena', action_type: 'reviewed_book', book_id: 'book_dune', review_id: 'rev_1', details: JSON.stringify({ rating: 5, title: 'An unassailable titan of ecological & philosophical sci-fi' }), likes: 27, created_at: '2026-09-29 14:20:00' },
      { id: 'act_5', user_id: 'usr_alex', action_type: 'finished_reading', book_id: 'book_atomic_habits', review_id: 'rev_5', details: JSON.stringify({ rating: 5 }), likes: 21, created_at: '2026-02-15 11:30:00' }
    ];

    for (const a of activities) {
      insertActivity.run(a.id, a.user_id, a.action_type, a.book_id, a.review_id, a.details, a.likes, a.created_at);
    }

    // 10. READING GOALS (2026 Reading Challenge)
    insertGoal.run('goal_elena_2026', 'usr_elena', 2026, 36, 24);
    insertGoal.run('goal_elena_2025', 'usr_elena', 2025, 30, 32);
    insertGoal.run('goal_marcus_2026', 'usr_marcus', 2026, 24, 18);
    insertGoal.run('goal_sophia_2026', 'usr_sophia', 2026, 40, 29);
    insertGoal.run('goal_alex_2026', 'usr_alex', 2026, 25, 20);

    // 11. READING SESSIONS
    insertSession.run('sess_1', 'usr_elena', 'book_children_of_time', '2026-11-22', 45, 35, 'Read chapter 14 during morning coffee. The Portia web architecture.');
    insertSession.run('sess_2', 'usr_elena', 'book_children_of_time', '2026-11-21', 60, 48, 'Lively perspective shift to the Gilgamesh generation ship.');
    insertSession.run('sess_3', 'usr_elena', 'book_children_of_time', '2026-11-20', 30, 22, 'Late night session.');
    insertSession.run('sess_4', 'usr_sophia', 'book_piranesi', '2026-11-21', 50, 40, 'Exploring the Ninth Vestibule.');

    // 12. JOURNAL ENTRIES
    insertJournal.run(
      'jrn_1',
      'usr_elena',
      'book_children_of_time',
      'Reflections on Non-Human Consciousness in Children of Time',
      'Tchaikovsky does something extraordinary here: instead of anthropomorphizing the arachnid species, he builds their cognition from the ground up based on vibrational acoustics, pheromonal communication, and 3D web geometry. It forces the reader to confront our biological biases.',
      JSON.stringify([
        { quote: 'Life is an engine for generating excitement and complexity.', page: 242, note: 'Core philosophical thesis of the terraform project.' },
        { quote: 'We are making something new here, something that will outlast the petty griefs of Earth.', page: 310, note: 'Dr. Kern\'s transmission.' }
      ]),
      JSON.stringify(['Speculative Fiction', 'Evolution', 'Philosophy of Mind']),
      0 // public
    );

    insertJournal.run(
      'jrn_2',
      'usr_elena',
      'book_dune',
      'The Perils of the Messianic Trap',
      'Herbert was fundamentally warning us against charismatic leaders. Paul Atreides is not a standard hero; he is trapped by the prescient vision of a jihad that will sweep sixty billion lives away, and his inability to turn away from the golden path.',
      JSON.stringify([
        { quote: 'I must not fear. Fear is the mind-killer. Fear is the little-death that brings total obliteration.', page: 28, note: 'Litany Against Fear' },
        { quote: 'There is no real ending. It\'s just the place where you stop the story.', page: 540, note: 'On narrative boundaries' }
      ]),
      JSON.stringify(['Political Philosophy', 'Classics']),
      0
    );

    // 13. NOTIFICATIONS
    insertNotification.run('notif_1', 'usr_elena', 'usr_marcus', 'follow', 'usr_marcus', 'Marcus Vance started following your reading updates', 0, '2026-11-22 09:30:00');
    insertNotification.run('notif_2', 'usr_elena', 'usr_sophia', 'review_like', 'rev_1', 'Sophia Chen liked your review of Dune', 0, '2026-11-21 17:40:00');
    insertNotification.run('notif_3', 'usr_elena', 'usr_alex', 'review_comment', 'rev_1', 'Alex Wright commented: "Your point on ecology changed how I view Arrakis."', 1, '2026-11-20 14:10:00');
    insertNotification.run('notif_4', 'usr_elena', null, 'reading_goal_milestone', 'goal_elena_2026', '🎉 Milestone reached: You completed 24 books! 67% of your 2026 Reading Challenge.', 1, '2026-11-18 20:00:00');
  });

  seedTransaction();
  console.log('✅ Seed completed successfully with 4 profiles, 12 books, user shelves, reviews, and community activity.');
}
