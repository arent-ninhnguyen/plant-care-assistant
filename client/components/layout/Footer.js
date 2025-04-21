import Link from 'next/link';
import { FaLeaf, FaGithub } from 'react-icons/fa';

const Footer = ({ className = '' }) => {
  return (
    <footer className={`bg-gray-800 text-white py-8 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="flex items-center">
              <FaLeaf className="mr-2 text-green-400" />
              <span className="font-bold text-lg">Plant Care Assistant</span>
            </Link>
            <p className="text-gray-400 mt-1">Keep your plants happy and healthy</p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <div className="flex space-x-4 mb-2">
              <a href="https://github.com" className="text-gray-400 hover:text-white transition-colors">
                <FaGithub />
              </a>
            </div>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Plant Care Assistant. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 