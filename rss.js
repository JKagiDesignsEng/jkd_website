// RSS Feed Handler
document.addEventListener('DOMContentLoaded', function() {
    // RSS feed URLs (using RSS2JSON service to handle CORS)
    const RSS_FEEDS = [
        {
            name: 'TechCrunch',
            url: 'https://techcrunch.com/feed/',
            color: '#0A9E00'
        },
        {
            name: 'Hacker News',
            url: 'https://news.ycombinator.com/rss',
            color: '#FF6600'
        },
        {
            name: 'The Verge',
            url: 'https://www.theverge.com/rss/index.xml',
            color: '#FA4D56'
        }
    ];

    let allFeeds = [];
    let currentFilter = 'all';

    const feedContainer = document.getElementById('feedContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const feedButtons = document.querySelectorAll('.feed-btn');

    // Function to fetch RSS feed using RSS2JSON API
    async function fetchFeed(feed, index) {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch feed');
            }
            
            const data = await response.json();
            
            if (data.status === 'ok') {
                return data.items.map(item => ({
                    source: feed.name,
                    sourceColor: feed.color,
                    sourceIndex: index,
                    title: item.title,
                    link: item.link,
                    description: stripHtml(item.description || item.content || ''),
                    pubDate: new Date(item.pubDate),
                    image: extractImage(item)
                }));
            } else {
                throw new Error('Feed error: ' + data.message);
            }
        } catch (error) {
            console.error(`Error fetching ${feed.name}:`, error);
            return [];
        }
    }

    // Strip HTML tags from description
    function stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || '';
        return text.substring(0, 200) + (text.length > 200 ? '...' : '');
    }

    // Extract image from feed item
    function extractImage(item) {
        // Check for enclosure (common in RSS feeds)
        if (item.enclosure && item.enclosure.link) {
            return item.enclosure.link;
        }
        
        // Check for thumbnail
        if (item.thumbnail) {
            return item.thumbnail;
        }

        // Try to extract image from description/content
        if (item.description || item.content) {
            const content = item.description || item.content;
            const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch && imgMatch[1]) {
                return imgMatch[1];
            }
        }

        return null;
    }

    // Format date
    function formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    // Create feed item HTML
    function createFeedItem(item) {
        const feedItem = document.createElement('div');
        feedItem.className = 'feed-item';
        feedItem.setAttribute('data-source', item.sourceIndex);

        let imageHtml = '';
        if (item.image) {
            imageHtml = `
                <img src="${item.image}" 
                     alt="${item.title}" 
                     class="feed-image"
                     onerror="this.classList.add('hidden')">
            `;
        }

        feedItem.innerHTML = `
            ${imageHtml}
            <div class="feed-content">
                <div class="feed-source" style="color: ${item.sourceColor}">${item.source}</div>
                <h3 class="feed-title">
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                        ${item.title}
                    </a>
                </h3>
                <p class="feed-description">${item.description}</p>
                <div class="feed-date">${formatDate(item.pubDate)}</div>
            </div>
        `;

        return feedItem;
    }

    // Display feeds
    function displayFeeds(feeds) {
        feedContainer.innerHTML = '';
        
        if (feeds.length === 0) {
            feedContainer.innerHTML = '<p style="text-align: center; color: var(--text-color); padding: 2rem;">No articles found.</p>';
            return;
        }

        feeds.forEach(feed => {
            const feedItem = createFeedItem(feed);
            feedContainer.appendChild(feedItem);
        });
    }

    // Filter feeds
    function filterFeeds(filterValue) {
        currentFilter = filterValue;
        
        if (filterValue === 'all') {
            displayFeeds(allFeeds);
        } else {
            const filtered = allFeeds.filter(feed => 
                feed.sourceIndex === parseInt(filterValue)
            );
            displayFeeds(filtered);
        }
    }

    // Mock feed data for demonstration (fallback when API is unavailable)
    function getMockFeeds() {
        const now = new Date();
        return [
            {
                source: 'TechCrunch',
                sourceColor: '#0A9E00',
                sourceIndex: 0,
                title: 'The Future of AI: Latest Developments in Machine Learning',
                link: '#',
                description: 'Exploring the latest breakthroughs in artificial intelligence and machine learning technologies that are shaping the future of software development.',
                pubDate: new Date(now - 3600000 * 2), // 2 hours ago
                image: 'https://via.placeholder.com/400x200/0A9E00/FFFFFF?text=TechCrunch'
            },
            {
                source: 'Hacker News',
                sourceColor: '#FF6600',
                sourceIndex: 1,
                title: 'Building Scalable Web Applications with Modern Frameworks',
                link: '#',
                description: 'A comprehensive guide to creating high-performance, scalable web applications using the latest development frameworks and best practices.',
                pubDate: new Date(now - 3600000 * 5), // 5 hours ago
                image: 'https://via.placeholder.com/400x200/FF6600/FFFFFF?text=Hacker+News'
            },
            {
                source: 'The Verge',
                sourceColor: '#FA4D56',
                sourceIndex: 2,
                title: 'Cloud Computing Trends Every Developer Should Know',
                link: '#',
                description: 'An overview of the most important cloud computing trends and technologies that are revolutionizing how we build and deploy applications.',
                pubDate: new Date(now - 3600000 * 8), // 8 hours ago
                image: 'https://via.placeholder.com/400x200/FA4D56/FFFFFF?text=The+Verge'
            },
            {
                source: 'TechCrunch',
                sourceColor: '#0A9E00',
                sourceIndex: 0,
                title: 'Cybersecurity Best Practices for Modern Applications',
                link: '#',
                description: 'Essential security measures and best practices every developer should implement to protect their applications from common vulnerabilities.',
                pubDate: new Date(now - 3600000 * 12), // 12 hours ago
                image: null
            },
            {
                source: 'Hacker News',
                sourceColor: '#FF6600',
                sourceIndex: 1,
                title: 'JavaScript Performance Optimization Techniques',
                link: '#',
                description: 'Learn how to optimize your JavaScript code for better performance and improved user experience in modern web applications.',
                pubDate: new Date(now - 3600000 * 18), // 18 hours ago
                image: 'https://via.placeholder.com/400x200/FF6600/FFFFFF?text=JavaScript'
            },
            {
                source: 'The Verge',
                sourceColor: '#FA4D56',
                sourceIndex: 2,
                title: 'The Rise of Progressive Web Apps',
                link: '#',
                description: 'Progressive Web Apps are changing how we think about web development, offering native-like experiences through web technologies.',
                pubDate: new Date(now - 3600000 * 24), // 1 day ago
                image: 'https://via.placeholder.com/400x200/FA4D56/FFFFFF?text=PWA'
            },
            {
                source: 'TechCrunch',
                sourceColor: '#0A9E00',
                sourceIndex: 0,
                title: 'DevOps Culture: Bridging Development and Operations',
                link: '#',
                description: 'Understanding the DevOps philosophy and how it can improve collaboration, efficiency, and product quality in software development.',
                pubDate: new Date(now - 3600000 * 30), // 1.25 days ago
                image: null
            },
            {
                source: 'Hacker News',
                sourceColor: '#FF6600',
                sourceIndex: 1,
                title: 'Microservices Architecture: Pros and Cons',
                link: '#',
                description: 'A detailed analysis of microservices architecture, including when to use it and potential challenges you might face.',
                pubDate: new Date(now - 3600000 * 36), // 1.5 days ago
                image: 'https://via.placeholder.com/400x200/FF6600/FFFFFF?text=Microservices'
            },
            {
                source: 'The Verge',
                sourceColor: '#FA4D56',
                sourceIndex: 2,
                title: 'Getting Started with Docker and Containerization',
                link: '#',
                description: 'Learn the basics of Docker and containerization technology to streamline your development and deployment processes.',
                pubDate: new Date(now - 3600000 * 48), // 2 days ago
                image: null
            }
        ];
    }

    // Load all feeds
    async function loadAllFeeds() {
        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';
        feedContainer.innerHTML = '';

        try {
            const feedPromises = RSS_FEEDS.map((feed, index) => fetchFeed(feed, index));
            const results = await Promise.all(feedPromises);
            
            // Combine all feeds
            allFeeds = results.flat();
            
            // Sort by date (newest first)
            allFeeds.sort((a, b) => b.pubDate - a.pubDate);
            
            loadingIndicator.style.display = 'none';
            
            // If no feeds loaded, use mock data
            if (allFeeds.length === 0) {
                console.log('No feeds loaded from API, using mock data for demonstration');
                allFeeds = getMockFeeds();
                displayFeeds(allFeeds);
            } else {
                displayFeeds(allFeeds);
            }
        } catch (error) {
            console.error('Error loading feeds:', error);
            loadingIndicator.style.display = 'none';
            // Use mock data as fallback
            console.log('Using mock data as fallback');
            allFeeds = getMockFeeds();
            displayFeeds(allFeeds);
        }
    }

    // Feed button click handlers
    feedButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            feedButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter feeds
            const filterValue = this.getAttribute('data-feed');
            filterFeeds(filterValue);
        });
    });

    // Initialize - load feeds
    loadAllFeeds();

    // Refresh feeds every 5 minutes
    setInterval(loadAllFeeds, 300000);
});
