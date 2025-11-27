import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ColorPickerProps {
    selectedColor: string;
    onSelect: (color: string) => void;
    direction?: 'up' | 'down';
    align?: 'left' | 'right';
    width?: string;
}

const COLORS = [
    { name: 'Executive branch (Black)', value: '#000000' },
    { name: 'Engineering (Purple)', value: '#800080' },
    { name: 'Electrical branch (Navy)', value: '#000080' },
    { name: 'Logistics (White)', value: '#FFFFFF' },
    { name: 'Medical (Maroon)', value: '#800000' },
    { name: 'Naval Armament Inspectorate (Grey)', value: '#808080' },
];

const ColorPicker: React.FC<ColorPickerProps> = ({
    selectedColor,
    onSelect,
    direction = 'down',
    align = 'left',
    width = 'w-64'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Calculate position when opening
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const newStyle: React.CSSProperties = {
                position: 'fixed',
                zIndex: 100,
            };

            // Handle Width
            if (width === 'w-full') {
                newStyle.width = rect.width;
            }

            // Handle Horizontal Alignment
            if (align === 'right') {
                newStyle.left = 'auto';
                newStyle.right = window.innerWidth - rect.right;
            } else {
                newStyle.left = rect.left;
                newStyle.right = 'auto';
            }

            // Handle Vertical Direction
            if (direction === 'up') {
                newStyle.bottom = window.innerHeight - rect.top + 8;
                newStyle.top = 'auto';
            } else {
                newStyle.top = rect.bottom + 8;
                newStyle.bottom = 'auto';
            }

            setDropdownStyle(newStyle);
        }
    }, [isOpen, direction, align, width]);

    const selectedColorObj = COLORS.find(c => c.value.toLowerCase() === selectedColor.toLowerCase()) || COLORS[0];

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-off-white text-sm w-full justify-between"
                title="Choose a colour"
            >
                <div className="flex items-center space-x-2">
                    <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: selectedColor }}
                    />
                    <span>{selectedColorObj.name.split('(')[0].trim()}</span>
                </div>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: direction === 'up' ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        style={dropdownStyle}
                        className={`${width !== 'w-full' ? width : ''} bg-navy-800/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden`}
                    >
                        <div className="p-1 max-h-60 overflow-y-auto">
                            {COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => {
                                        onSelect(color.value);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 bg-transparent hover:bg-white/10 rounded-md transition-colors group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                                            style={{ backgroundColor: color.value }}
                                        />
                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors text-left">
                                            {color.name}
                                        </span>
                                    </div>
                                    {selectedColor.toLowerCase() === color.value.toLowerCase() && (
                                        <Check size={14} className="text-ocean-blue" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ColorPicker;
