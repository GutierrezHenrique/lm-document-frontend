import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export function SplashScreen({ isLoading }: { isLoading: boolean }) {
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50"
                >
                    <div className="flex flex-col items-center gap-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                duration: 0.6,
                                ease: "easeOut",
                            }}
                            className="relative"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-4 rounded-[2rem] border-2 border-transparent border-t-blue-500/80 border-l-blue-500/30"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-6 rounded-[2.5rem] border border-transparent border-b-blue-600/50 border-r-blue-400/20"
                            />
                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-8 rounded-[1.5rem] shadow-2xl shadow-blue-200/40 relative z-10">
                                <GraduationCap className="w-20 h-20 text-white" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="text-center"
                        >
                            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-4">
                                Nexova AI
                            </h1>
                            <div className="flex gap-2 justify-center mt-6">
                                <motion.div
                                    className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"
                                    animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div
                                    className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"
                                    animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                                />
                                <motion.div
                                    className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"
                                    animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                                />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
