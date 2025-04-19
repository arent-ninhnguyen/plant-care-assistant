import Link from 'next/link';
import { FaLeaf, FaGithub } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="flex items-center text-white">
              <FaLeaf className="mr-2" />
              <span className="font-bold text-lg">Plant Care Assistant</span>
            </Link>
            <p className="text-gray-400 mt-2">Track and manage your plant care needs</p>
          </div>
          
          <div className="flex flex-col">
            <div className="flex space-x-6 mb-4">
              <Link href="/" className="text-gray-400 hover:text-white">
                Home
              </Link>
              <Link href="/about" className="text-gray-400 hover:text-white">
                About
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">
                Terms
              </Link>
            </div>
            
            <div className="text-gray-400 text-sm text-center md:text-right">
              &copy; {new Date().getFullYear()} Plant Care Assistant. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 