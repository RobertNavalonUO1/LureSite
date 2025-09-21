import React from 'react';

const SearchTags = ({ tags = [], onTagClick }) => {
  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {tags.map((tag, i) => (
        <button
          key={i}
          onClick={() => onTagClick?.(tag)}
          className="px-3 py-1 text-sm border border-indigo-300 text-indigo-700 rounded-full hover:bg-indigo-50 transition"
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

export default SearchTags;