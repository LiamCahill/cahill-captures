import React, { useState, useRef, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import {api} from "../../convex/_generated/api"
import { useQuery } from "convex/react";
import "../styles/SearchBar.css"

interface SearchResult {
    _id: string
    type: string
    title: string
    name: string
}

const SearchBar = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const spaceMatch = location.pathname.match(/^\/c\/([^/]+)/);
    const currentSpace = spaceMatch ? spaceMatch[1] : null;
    const [searchQuery, setSearchQuery] = useState("")
    const [isActive, setIsActive] = useState(false)
    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
        }
    }, [])

    // perform the search query
    const spaceSearch = useQuery(api.space.search, currentSpace ? "skip" : {
        queryStr: searchQuery,
    });
    const postSearch = useQuery(api.post.search, currentSpace ? {
        queryStr: searchQuery,
        space: currentSpace,
      } : "skip");
      const results = currentSpace ? postSearch : spaceSearch;

    const handleFocus = () => {
        setIsActive(true)
    }

    const handleBlur = () => {
        blurTimeoutRef.current = setTimeout(() => setIsActive(false), 200)
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }

    const handleResultClick = (result: SearchResult) => {
        if(result.type === "post") {
            navigate(`/post/${result._id}`)
        } else {
            navigate(`/c/${result.name}`)
        }
        setIsActive(false)
        setSearchQuery("")
    }

    const getIconForType = (type: string) => {
        switch (type) {
            case "community":
                return "🧑‍🧑‍🧒";
            case "post":
                return "📝";
            default:
                return "❇️";
        }
    };

    return (
        <div className="search-wrapper">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={
                currentSpace
                  ? `Search c/${currentSpace}`
                  : "Search for a community"
              }
              value={searchQuery}
              onChange={handleSearch}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            {currentSpace && (
              <div className="search-scope">
                <span>in c/{currentSpace}</span>
              </div>
            )}
          </div>
          {isActive && (
            <div className="search-results">
              {searchQuery === "" ? (
                <div className="empty-state">
                  <p>Try searching for posts or communities.</p>
                </div>
              ) : results && results.length > 0 ? (
                <ul className="results-list">
                  {results.map((result) => (
                    <li
                      key={result._id}
                      className="result-item"
                      onClick={() => handleResultClick(result)}
                    >
                      <span className="result-icon">
                        {getIconForType(result.type)}
                      </span>
                      <div className="result-container">
                        <span className="result-title">{result.title}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <p>No results found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };
    
    export default SearchBar;