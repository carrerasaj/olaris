class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '20px', background: '#f9fafb' }}>
          <h1>Olaris Consulting Limited</h1>
          <p>Error loading page. Please refresh or contact us at info@olaris.co.uk.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="flex items-center justify-between px-6 py-4 shadow-md bg-white dark:bg-gray-800 sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <img src="/images/logo.png" alt="Olaris Consulting Logo" className="h-10 w-10" />
        <span className="font-bold text-xl text-blue-800 dark:text-blue-300">Olaris Consulting</span>
      </div>
      <div className="flex items-center space-x-4">
        <button id="darkModeToggle" aria-label="Toggle dark mode" className="text-gray-600 dark:text-gray-300 focus:outline-none">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </button>
        <div className="md:hidden">
          <button id="menuToggle" aria-label="Toggle navigation menu" className="text-gray-600 dark:text-gray-300 focus:outline-none" onClick={toggleMenu}>
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div
        id="navMenu"
        className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex md:space-x-4 text-gray-600 dark:text-gray-300 text-lg flex-col md:flex-row flex-wrap absolute md:static top-16 left-0 right-0 bg-white dark:bg-gray-800 md:bg-transparent p-4 md:p-0`}
      >
        <a href="#" className="nav-button hover:text-white hover:bg-blue-700 dark:hover:bg-blue-500 py-2 px-4 rounded-lg transition">Home</a>
        <a href="#about" className="nav-button hover:text-white hover:bg-blue-700 dark:hover:bg-blue-500 py-2 px-4 rounded-lg transition">About</a>
        <a href="#services" className="nav-button hover:text-white hover:bg-blue-700 dark:hover:bg-blue-500 py-2 px-4 rounded-lg transition">Services</a>
        <a href="#projects" className="nav-button hover:text-white hover:bg-blue-700 dark:hover:bg-blue-500 py-2 px-4 rounded-lg transition">Projects</a>
        <a href="#contact" className="nav-button hover:text-white hover:bg-blue-700 dark:hover:bg-blue-500 py-2 px-4 rounded-lg transition">Contact</a>
        <a href="blog.html" className="nav-button hover:text-white hover:bg-blue-700 dark:hover:bg-blue-500 py-2 px-4 rounded-lg transition">Blog</a>
      </div>
    </nav>
  );
};

const Hero = () => {
  const [variant, setVariant] = React.useState('A');

  React.useEffect(() => {
    const random = Math.random();
    const selectedVariant = random > 0.5 ? 'A' : 'B';
    setVariant(selectedVariant);
    gtag('event', 'ab_test_view', {
      'event_category': 'A/B Test',
      'event_label': `Hero CTA Variant ${selectedVariant}`
    });
  }, []);

  const handleCTAClick = () => {
    gtag('event', 'ab_test_click', {
      'event_category': 'A/B Test',
      'event_label': `Hero CTA Variant ${variant}`
    });
  };

  return (
    <section id="home" className="relative h-screen flex items-center justify-center text-white bg-gradient-to-br from-blue-900 via-blue-700 to-blue-900 animate-gradient overflow-hidden snap-start">
      <video autoPlay muted loop playsInline loading="lazy" className="absolute w-full h-full object-cover opacity-40">
        <source src="/videos/fleet-management.webm" type="video/webm" />
        <source src="/videos/fleet-management.mp4" type="video/mp4" />
        <img src="/images/fleet-management-fallback.jpg" alt="Fleet Management Background" className="w-full h-full object-cover" />
      </video>
      <div className="relative z-10 text-center px-6 fade-in-hero">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-2" data-aos="fade-up">Olaris Consulting Limited</h1>
        <p className="text-lg md:text-xl mb-4" data-aos="fade-up" data-aos-delay="50">Driving Sustainable Growth with Blockchain Innovation</p>
        <p className="text-xl md:text-2xl mb-8" data-aos="fade-up" data-aos-delay="100">Charlbury-based experts in fleet management, strategic growth, and blockchain ESG solutions.</p>
        <div className="space-x-4">
          <a href="#contact" className="bg-gradient-to-r from-blue-600 to-blue-800 py-3 px-8 rounded-full text-lg font-bold hover:scale-105 transform transition" data-aos="fade-up" data-aos-delay="200" onClick={handleCTAClick}>
            {variant === 'A' ? 'Request a Free Consultation' : 'Get a Free Quote'}
          </a>
          <a href="#services" className="border-2 border-white py-3 px-8 rounded-full text-lg font-bold hover:bg-white hover:text-blue-800 transition" data-aos="fade-up" data-aos-delay="300">Explore Services</a>
          <a href="/fleet-management-checklist.pdf" download className="border-2 border-white py-3 px-8 rounded-full text-lg font-bold hover:bg-white hover:text-blue-800 transition" data-aos="fade-up" data-aos-delay="400" onClick={() => gtag('event', 'download_guide', { 'event_category': 'Lead', 'event_label': 'Fleet Management Checklist' })}>Download Checklist</a>
        </div>
        <div className="mt-12">
          <a href="#about" className="text-white animate-bounce">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

const About = () => (
  <section id="about" className="section py-24 gradient-section dark:text-gray-300 snap-start">
    <div className="container mx-auto px-6 text-center" data-aos="fade-up">
      <h2 className="text-4xl font-extrabold mb-6 text-blue-800 dark:text-blue-300">About Us</h2>
      <p className="max-w-3xl mx-auto text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Olaris Consulting Limited, based in Charlbury, UK, delivers strategic growth initiatives and operational excellence in fleet management, mobility, and digital transformation. Our expertise in blockchain and ESG solutions empowers businesses to thrive in a competitive landscape.
      </p>
      <div className="mt-6">
        <video autoPlay muted loop playsInline loading="lazy" className="w-full max-w-md mx-auto rounded-lg shadow-md">
          <source src="/videos/alan-carreras-message.webm" type="video/webm" />
          <source src="/videos/alan-carreras-message.mp4" type="video/mp4" />
          <img src="/images/profile.png" alt="Alan Carreras Message" className="w-full max-w-md mx-auto rounded-lg" />
        </video>
        <p className="mt-4 text-gray-700 dark:text-gray-300 italic">"At Olaris, we’re passionate about driving sustainable growth through innovation." - Alan Carreras, Founder</p>
      </div>
    </div>
  </section>
);

const Services = () => (
  <section id="services" className="section py-24 min-h-0">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-4xl font-extrabold mb-12 text-blue-800 dark:text-blue-300" data-aos="fade-up">Our Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-10" data-aos="fade-up" data-aos-delay="100">
        {[
          { title: "Fleet Management", desc: "Reduce costs by up to 10% with optimized leasing, vehicle tracking, and operational efficiency tailored to your fleet.", icon: "🚛" },
          { title: "Expansion Strategy", desc: "Grow your business with data-driven market intelligence and strategic planning for sustainable expansion.", icon: "📈" },
          { title: "M&A Advisory", desc: "Navigate complex mergers and acquisitions with expert guidance to maximize value and minimize risk.", icon: "🤝" },
          { title: "Digital Integration", desc: "Transform your operations with blockchain, Azure, and ESG tracking for compliance and innovation.", icon: "🔗" },
        ].map((service, idx) => (
          <div key={idx} className="p-6 rounded-lg shadow-md hover:shadow-xl transform hover:scale-105 transition bg-white dark:bg-gray-700">
            <div className="text-4xl mb-3">{service.icon}</div>
            <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-3">{service.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{service.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Projects = () => (
  <section id="projects" className="section py-24 gradient-section dark:text-gray-300 snap-start">
    <div className="text-center mb-12" data-aos="fade-up">
      <h2 className="text-4xl font-extrabold text-blue-800 dark:text-blue-300">Our Projects</h2>
    </div>
    <div className="max-w-7xl mx-auto grid gap-8 grid-cols-1 md:grid-cols-2 px-6 md:px-0">
      {[
        { title: "Jurni Leasing Expansion", video: "jurni-leasing", desc: "Scaled Jurni Leasing to a Top 10 UK broker, managing over 30,000 vehicles with streamlined operations." },
        { title: "Blockchain ESG Platform", video: "web-salsac", desc: "Developed web_salsac_app, a blockchain-based ESG solution ensuring compliance for fleet operators." },
      ].map((proj, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:scale-105" data-aos="fade-up" data-aos-delay={idx * 100}>
          <video autoPlay muted loop playsInline loading="lazy" className="w-full h-64 object-cover">
            <source src={`/videos/${proj.video}.webm`} type="video/webm" />
            <source src={`/videos/${proj.video}.mp4`} type="video/mp4" />
            <img src={`/videos/${proj.video}-fallback.jpeg`} alt={proj.title} className="w-full h-64 object-cover" />
          </video>
          <div className="p-6">
            <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-2">{proj.title}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{proj.desc}</p>
            <a href="#contact" className="text-blue-600 dark:text-blue-300 hover:underline">Learn More</a>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const FeaturedBlogPosts = () => (
  <section className="py-16 gradient-section dark:text-gray-300">
    <div className="container mx-auto px-6 text-center" data-aos="fade-up">
      <h2 className="text-4xl font-extrabold mb-8 text-blue-800 dark:text-blue-300">Featured Blog Posts</h2>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl transition" data-aos="fade-up" data-aos-delay="100">
          <img src="/images/blog-post-1.jpeg" alt="Fleet Management Trends" className="w-full h-48 object-cover rounded-t-lg" />
          <div className="p-6">
            <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">Top 5 Fleet Management Trends for 2025</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Discover the latest trends shaping the future of fleet management in the UK.</p>
            <a href="blog-post-1.html" className="text-blue-600 dark:text-blue-300 hover:underline">Read More</a>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-xl transition" data-aos="fade-up" data-aos-delay="200">
          <img src="/images/fleet-management-charlbury.jpg" alt="Fleet Management in Charlbury" className="w-full h-48 object-cover rounded-t-lg" />
          <div className="p-6">
            <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">Fleet Management Solutions in Charlbury</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Learn why Olaris Consulting is the top choice for fleet management in Charlbury, UK.</p>
            <a href="blog-post-2.html" className="text-blue-600 dark:text-blue-300 hover:underline">Read More</a>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section className="py-12 gradient-section dark:text-gray-300">
    <div className="container mx-auto px-6 text-center" data-aos="fade-up">
      <h2 className="text-3xl font-extrabold mb-8 text-blue-800 dark:text-blue-300">What Our Clients Say</h2>
      <div className="grid gap-8 md:grid-cols-2">
        {[
          { quote: "Olaris transformed our fleet operations, saving us 8% annually.", author: "John Doe, Fleet Manager" },
          { quote: "Their blockchain ESG platform is a game-changer for compliance.", author: "Jane Smith, CEO" },
        ].map((testimonial, idx) => (
          <div key={idx} className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md">
            <p className="text-gray-600 dark:text-gray-300 italic">"{testimonial.quote}"</p>
            <p className="mt-4 font-semibold text-blue-700 dark:text-blue-300">{testimonial.author}</p>
          </div>
        ))}
      </div>
      <div className="mt-12">
        <a href="#contact" onClick={() => gtag('event', 'cta_click', { 'event_category': 'CTA', 'event_label': 'Testimonial Consultation' })} className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transform transition">See How We Can Help You</a>
      </div>
    </div>
  </section>
);

const Contact = () => {
  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateForm = (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const name = event.target[0].value.trim();
    const email = event.target[1].value.trim();
    const message = event.target[2].value.trim();
    const newErrors = {};

    if (!name) newErrors.name = "Name is required";
    if (!email.includes("@")) newErrors.email = "Valid email is required";
    if (!message) newErrors.message = "Message is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setTimeout(() => {
        gtag('event', 'form_submission', { 'event_category': 'Contact', 'event_label': 'Consultation Request' });
        alert('✅ Thank you! Your message has been sent successfully.');
        event.target.reset();
        setIsSubmitting(false);
      }, 1000);
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section py-24 bg-gradient-to-br from-blue-800 via-blue-600 to-blue-800 text-white snap-start">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-6" data-aos="fade-up">
        <div className="flex flex-col items-center text-center">
          <img src="/images/profile.png" alt="Alan Carreras, Consultant" className="rounded-lg shadow-2xl w-60 h-60 object-cover mb-6" loading="lazy" />
          <p className="text-lg leading-relaxed">👋 Hi, I'm Alan Carreras, Charlbury-based consultant. Let's discuss your business goals!</p>
        </div>
        <form id="contactForm" onSubmit={validateForm} className="bg-white rounded-lg p-8 shadow-2xl space-y-4 text-gray-800">
          <div>
            <input type="text" placeholder="Name" aria-label="Name" className="w-full p-3 rounded border-gray-300 focus:ring-2 focus:ring-blue-500" required />
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>
          <div>
            <input type="email" placeholder="Email" aria-label="Email" className="w-full p-3 rounded border-gray-300 focus:ring-2 focus:ring-blue-500" required />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>
          <div>
            <textarea placeholder="Message" aria-label="Message" className="w-full p-3 rounded border-gray-300 focus:ring-2 focus:ring-blue-500" rows="4" required></textarea>
            {errors.message && <p className="error-message">{errors.message}</p>}
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 rounded-lg hover:scale-105 transform transition flex items-center justify-center" disabled={isSubmitting}>
            {isSubmitting ? <div className="loading-spinner"></div> : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
};

const Footer = () => {
  const emailRef = React.useRef(null);

  React.useEffect(() => {
    if (emailRef.current) {
      emailRef.current.href = "mailto:info@olaris.co.uk";
      emailRef.current.textContent = "info@olaris.co.uk";
    }
  }, []);

  return (
    <footer className="text-center py-6 text-gray-500 dark:text-gray-300 text-sm bg-white dark:bg-gray-800">
      <p>© 2025 Olaris Consulting Limited. All rights reserved.</p>
      <p>
        Olaris Consulting Limited, 1 Graces Court, The Slade, Charlbury OX7 3EG, UK | Phone: +44-7919-35-40-68 | Email: <a ref={emailRef} className="text-gray-600 dark:text-gray-300 hover:underline"></a>
      </p>
      <div className="mt-2">
        <a href="https://linkedin.com/company/olaris-consulting-limited" className="text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-500 mx-2">LinkedIn</a> |
        <a href="https://twitter.com/olarisconsult" className="text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-500 mx-2">Twitter</a> |
        <a href="https://www.facebook.com/sharer/sharer.php?u=https://olaris.co.uk" className="text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-500 mx-2">Share on Facebook</a> |
        <a href="blog.html" className="text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-500 mx-2">Blog</a>
      </div>
      <div className="mt-4">
        <h3 className="text-gray-700 dark:text-gray-300 font-semibold">Subscribe to Our Newsletter</h3>
        <form action="https://olaris.us21.list-manage.com/subscribe/post?u=XXXX&id=XXXX" method="post" className="mt-2 flex justify-center">
          <input type="email" placeholder="Enter your email" aria-label="Email for newsletter" className="p-2 rounded-l border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-blue-500" required />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded-r hover:bg-blue-700 transition">Subscribe</button>
        </form>
        <p className="mt-2 text-xs">Get a Free Fleet Management Guide upon signup!</p>
      </div>
      <div className="mt-4">
        <a href="privacy-policy.html" className="text-gray-600 dark:text-gray-300 hover:underline">Privacy Policy</a>
      </div>
    </footer>
  );
};

const App = () => (
  <ErrorBoundary>
    <Navbar />
    <Hero />
    <About />
    <Services />
    <Projects />
    <FeaturedBlogPosts />
    <Testimonials />
    <Contact />
    <Footer />
  </ErrorBoundary>
);

// Attach App to the global window object for <script> tag usage
window.App = App;