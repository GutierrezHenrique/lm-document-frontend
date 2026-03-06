import { GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export function Logo({ className = '', showText = true }: LogoProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <motion.div
                className="bg-blue-600 p-2 rounded-lg relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <motion.div
                    className="absolute inset-0 bg-blue-400 opacity-0"
                    whileHover={{ opacity: 0.2 }}
                    transition={{ duration: 0.2 }}
                />
                <GraduationCap className="w-5 h-5 text-white relative z-10" />
            </motion.div>
            {showText && (
                <span className="font-bold text-xl tracking-tight text-slate-900" aria-hidden>
                    Nexova AI
                </span>
            )}
        </div>
    );
}
