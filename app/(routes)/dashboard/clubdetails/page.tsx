"use client";

import React, { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic';

const ClubDetails = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }
 
    return (
        <div className="flex-1">
            <div className="container mx-auto px-6">
                <div className="flex flex-col gap-6 bg-gray-50 p-6 rounded-lg">
                    <h1 className="text-2xl font-bold">Club Detail</h1>
                    <p className="text-gray-600"></p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2">Upload Club Logo</label>
                            <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded-lg">
                                <div className="flex justify-center">
                                    <button className="p-2">+</button>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">*Must be PNG, JPG, SVG or PDF</p>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2">Enter club name</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border rounded-lg"
                                placeholder="Enter your club name"
                            />
                        </div>

                        <div>
                            <label className="block mb-2">Short Description</label>
                            <textarea 
                                className="w-full p-2 border rounded-lg"
                                placeholder="Enter your description"
                                rows={4}
                            />
                        </div>

                        <div>
                            <label className="block mb-2">Upload Cover Image</label>
                            <button className="flex items-center gap-2 border p-2 rounded-lg">
                                <span>↑</span> Upload
                            </button>
                            <p className="text-sm text-gray-500 mt-2">*Must be PNG or JPG. The cover should be 16:9 ratio</p>
                        </div>

                        <div>
                            <label className="block mb-2">Statistics</label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((_, index) => (
                                    <div key={index} className="space-y-2">
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border rounded-lg"
                                            placeholder="Statistics Name"
                                        />
                                        <select className="w-full p-2 border rounded-lg">
                                            <option>Select Icon</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClubDetails;
