import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getCategoryIcon } from '../utils/categoryIcons';
import { categories } from '../data/categories';

const LandingPage = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const features = [
    {
      icon: '🚀',
      title: 'Accelerate Your Learning',
      description: 'Access thousands of courses taught by industry experts.'
    },
    {
      icon: '💼',
      title: 'Boost Your Career',
      description: 'Gain in-demand skills to advance in your professional journey.'
    },
    {
      icon: '🏆',
      title: 'Get Certified',
      description: 'Earn certificates upon completion to showcase your accomplishments.'
    },
    {
      icon: '📱',
      title: 'Learn Anywhere',
      description: 'Access your courses on any device, anytime, anywhere.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'UX Designer',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      text: '"The courses were instrumental in helping me pivot my career into UX design. Highly recommended!"'
    },
    {
      name: 'Michael Chen',
      role: 'Software Engineer',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      text: '"I gained practical skills that I immediately applied to my job. The instructors are top-notch."'
    },
    {
      name: 'Emma Davis',
      role: 'Marketing Manager',
      image: 'https://randomuser.me/api/portraits/women/63.jpg',
      text: '"The digital marketing courses helped me increase our company\'s ROI by 150% in just 3 months."'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black opacity-10 pattern-dots"></div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Unlock Your Potential with Expert-Led Courses
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Join millions of learners worldwide and transform your career with our comprehensive course library.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {currentUser ? (
                  <button
                    onClick={() => navigate('/')}
                    className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Explore Courses
                  </button>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Get Started for Free
                    </Link>
                    <Link
                      to="/login"
                      className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Log In
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="md:w-1/2">
              <img
                src={`${process.env.PUBLIC_URL}/hero-image.svg`}
                alt="Online learning"
                className="w-full max-w-md mx-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-800">
            Why Learn With Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-5">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-800">
            Explore Our Top Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/')}
              >
                <div className="text-4xl mb-4">{getCategoryIcon(category)}</div>
                <h3 className="font-semibold text-gray-800">{category}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-800">
            What Our Students Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg relative">
                <div className="text-blue-600 text-5xl absolute -top-5 left-8">"</div>
                <p className="text-gray-700 mb-6 pt-6">{testimonial.text}</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{testimonial.name}</p>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Learning?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join our community of learners and start your journey toward mastery today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {currentUser ? (
              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Explore Courses
              </button>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Sign Up Now — It's Free!
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <h3 className="text-xl font-bold mb-4">Course Manager</h3>
              <p className="text-gray-400 mb-4">
                Transforming lives through high-quality online education accessible to everyone, everywhere.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Categories</h3>
              <ul className="space-y-2">
                {categories.slice(0, 5).map((category, index) => (
                  <li key={index}>
                    <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} Course Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
