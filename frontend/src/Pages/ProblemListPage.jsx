import React, { useEffect, useState, useRef } from 'react'; // Import useRef
import API from '../utils/api'; // Import your configured API utility
import { Link } from 'react-router-dom';

const getDifficultyBadge = (difficulty) => {
    let bgColor, textColor;
    switch (difficulty) {
        case 'Easy':
            bgColor = 'bg-emerald-50';
            textColor = 'text-emerald-700';
            break;
        case 'Medium':
            bgColor = 'bg-amber-50';
            textColor = 'text-amber-700';
            break;
        case 'Hard':
            bgColor = 'bg-rose-50';
            textColor = 'text-rose-700';
            break;
        default:
            bgColor = 'bg-gray-100';
            textColor = 'text-gray-600';
    }
    return (
        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-inner ${bgColor} ${textColor}`}>
            {difficulty}
        </span>
    );
};

const ProblemsListPage = () => {
    // Original state for fetching problems
    const [allProblems, setAllProblems] = useState([]); // Stores all problems fetched initially
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New state for filtering and searching
    const [filteredProblems, setFilteredProblems] = useState([]); // Problems currently displayed
    const [difficultyFilter, setDifficultyFilter] = useState(''); // State for difficulty dropdown
    const [selectedTags, setSelectedTags] = useState([]); // State for selected tags (e.g., ['Arrays', 'Math'])
    const [searchTerm, setSearchTerm] = useState(''); // State for search input

    // NEW STATE for controlling tag dropdown visibility
    const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false); // Initially closed
    const tagsDropdownRef = useRef(null); // Ref for detecting clicks outside the dropdown


    // Effect to fetch ALL problems once when the component mounts
    useEffect(() => {
        const fetchAllProblems = async () => {
            try {
                const res = await API.get('/problems');
                setAllProblems(res.data);
                setFilteredProblems(res.data); // Initially, filtered problems are all problems
                setLoading(false);
            } catch (err) {
                console.error('Error fetching problems:', err.response?.data || err);
                setError('Failed to fetch problems. Please try again later.');
                setLoading(false);
            }
        };

        fetchAllProblems();
    }, []); // Empty dependency array means this runs only once

    // Effect to apply filters whenever filter states or allProblems change
    useEffect(() => {
        let currentFiltered = [...allProblems]; // Start with all problems

        // 1. Apply Difficulty Filter
        if (difficultyFilter) {
            currentFiltered = currentFiltered.filter(problem =>
                problem.difficulty.toLowerCase() === difficultyFilter.toLowerCase()
            );
        }

        // 2. Apply Tags Filter
        if (selectedTags.length > 0) {
            currentFiltered = currentFiltered.filter(problem => {
                // Check if the problem has AT LEAST ONE of the selected tags
                if (!problem.tags) return false; // Ensure problem.tags exists
                return selectedTags.some(selectedTag =>
                    problem.tags.map(tag => tag.toLowerCase()).includes(selectedTag.toLowerCase())
                );
            });
        }

        // 3. Apply Search Term
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            currentFiltered = currentFiltered.filter(problem =>
                problem.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                (problem.description && problem.description.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }

        setFilteredProblems(currentFiltered);

    }, [difficultyFilter, selectedTags, searchTerm, allProblems]); // Re-run when these states change

    // Handler for tag checkboxes
    const handleTagChange = (e) => {
        const tag = e.target.value;
        if (e.target.checked) {
            setSelectedTags([...selectedTags, tag]);
        } else {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        }
    };

    // Handler to remove a tag from the active filters (e.g., by clicking its badge)
    const handleRemoveTag = (tagToRemove) => {
        setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
    };

    // Effect to handle clicks outside the tags dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
                setIsTagsDropdownOpen(false);
            }
        };

        // Add event listener when dropdown is open
        if (isTagsDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Clean up event listener when component unmounts or dropdown closes
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isTagsDropdownOpen]); // Re-run effect when dropdown state changes


    // --- Common Tags for your platform (you might need to adjust these based on your actual problem data) ---
    const availableTags = [
        'Arrays', 'Strings', 'Math', 'Dynamic Programming', 'Trees',
        'Graphs', 'Greedy', 'Binary Search', 'Sorting', 'Hashing',
        'Linked List', 'Two Pointers', 'Stack', 'Queue', 'Recursion',
        'Backtracking', 'Bit Manipulation'
    ];


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 text-xl font-medium text-purple-600">
                <svg className="animate-spin h-8 w-8 mr-3 text-purple-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading problems...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 text-red-600 text-xl font-bold">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
             {/* Background blobs for visual effect */}
             <div className="absolute top-1/4 left-[10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob"></div>
             <div className="absolute top-[60%] right-[15%] w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob animation-delay-2000"></div>
             <div className="absolute bottom-1/4 left-[35%] w-56 h-56 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-slow-blob animation-delay-4000"></div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-12 text-center leading-tight tracking-tighter drop-shadow-sm">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700">
                        Explore Challenges
                    </span>
                </h1>

                {/* --- Filter and Search UI Section - MODIFIED FOR MULTI-SELECT DROPDOWN TAGS --- */}
                <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Difficulty Filter */}
                        <div>
                            <label htmlFor="difficulty-filter" className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Difficulty:
                            </label>
                            <select
                                id="difficulty-filter"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm"
                                value={difficultyFilter}
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                            >
                                <option value="">All Difficulties</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>

                        {/* Search Bar */}
                        <div>
                            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-2">
                                Search Problems:
                            </label>
                            <input
                                type="text"
                                id="search-input"
                                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm"
                                placeholder="Search by title or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Tags Filter - NOW AS A MULTI-SELECT DROPDOWN */}
                        <div className="relative" ref={tagsDropdownRef}> {/* Attach ref here */}
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Tags:
                            </label>
                            <button
                                type="button"
                                className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 sm:text-sm"
                                onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
                            >
                                <span className="block truncate">
                                    {selectedTags.length > 0
                                        ? selectedTags.join(', ')
                                        : 'All Tags'}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.25 9.5a.75.75 0 011.1 1.02L10 15.148l2.7-2.908a.75.75 0 011.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.55-.24z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            </button>

                            {/* Tags Dropdown Menu */}
                            {isTagsDropdownOpen && (
                                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {availableTags.map(tag => (
                                        <div
                                            key={tag}
                                            className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-purple-50 hover:text-purple-900"
                                            // Make the whole div clickable for better UX
                                            onClick={() => {
                                                // Simulate checkbox toggle
                                                const isChecked = selectedTags.includes(tag);
                                                if (isChecked) {
                                                    setSelectedTags(selectedTags.filter(t => t !== tag));
                                                } else {
                                                    setSelectedTags([...selectedTags, tag]);
                                                }
                                            }}
                                        >
                                            <input
                                                id={`tag-${tag}`}
                                                name={`tag-${tag}`}
                                                type="checkbox"
                                                value={tag}
                                                checked={selectedTags.includes(tag)}
                                                onChange={handleTagChange} // Still use the handler to keep state in sync
                                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                                // Prevent event bubbling from inner checkbox to parent div's onClick
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <label htmlFor={`tag-${tag}`} className="ml-3 block truncate text-gray-900 cursor-pointer">
                                                {tag}
                                            </label>
                                            {/* Checkmark for selected items */}
                                            {selectedTags.includes(tag) && (
                                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-purple-600">
                                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.877 3.878 7.424-9.704a.75.75 0 011.052-.143z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* --- End Filter and Search UI Section --- */}

                {/* --- Active Filters Display Section --- */}
                {selectedTags.length > 0 && ( // Only show this section if there are selected tags
                    <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-4 mb-8 flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 mr-2">Active Filters:</span>
                        {selectedTags.map(tag => (
                            <span
                                key={`active-tag-${tag}`}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 shadow-sm cursor-pointer transition-colors duration-200 hover:bg-purple-200"
                                onClick={() => handleRemoveTag(tag)}
                            >
                                {tag}
                                <button
                                    type="button"
                                    className="ml-2 -mr-0.5 h-4 w-4 inline-flex items-center justify-center rounded-full text-purple-500 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                >
                                    <span className="sr-only">Remove {tag} filter</span>
                                    <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                        <button
                            onClick={() => setSelectedTags([])}
                            className="ml-auto text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors duration-200"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
                {/* --- END: Active Filters Display Section --- */}


                <div className="bg-white rounded-xl shadow-lg border border-purple-100 divide-y divide-gray-200 overflow-hidden">
                    {/* Render filtered problems */}
                    {filteredProblems.length > 0 ? (
                        filteredProblems.map((problem, index) => (
                            <Link
                                key={problem._id}
                                to={`/problems/${problem._id}`}
                                className="block p-4 sm:p-6 flex items-center justify-between transition-colors duration-200 hover:bg-gray-50"
                            >
                                <div className="flex flex-col flex-grow mr-4">
                                    <h2 className="text-lg font-semibold text-gray-800 hover:text-purple-700 transition-colors duration-200 leading-snug">
                                        {problem.title}
                                    </h2>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {problem.tags && problem.tags.length > 0 && problem.tags.map((tag, tagIndex) => (
                                            <span
                                                key={tagIndex}
                                                className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-shrink-0">
                                    {getDifficultyBadge(problem.difficulty)}
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p className="p-6 text-center text-gray-500 text-xl py-10">
                            No challenges found matching your criteria.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProblemsListPage;