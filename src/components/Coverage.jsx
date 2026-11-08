import React, { useEffect, useState } from 'react'
import { fetchWprCoverage } from '../api.js'
import { track } from '../analytics.js'
import Section from './Section.jsx'

// Live read of WPR's WordPress REST API — headline, featured photo and
// excerpt per story. Renders nothing until the program's newsCategory is
// set in config, and nothing on error.
export default function Coverage({ team }) {
  const [posts, setPosts] = useState(null)

  useEffect(() => {
    setPosts(null)
    fetchWprCoverage(team).then(setPosts).catch(() => setPosts(null))
  }, [team])

  if (!posts || !posts.length) return null

  return (
    <Section
      title="From the newsroom"
      sub="Recent Badgers coverage on Wausau Pilot & Review."
    >
      <div className="newsgrid">
        {posts.map((post) => (
          <a
            key={post.id}
            className="newscard"
            href={post.link}
            target="_top"
            onClick={() => track('Coverage Click')}
          >
            {/* Eager on purpose: four ~11 KB thumbnails aren't worth the
                lazy-load edge cases. */}
            {post.image && (
              <img className="newscard__img" src={post.image} alt={post.imageAlt} />
            )}
            <div className="newscard__body">
              <div className="newscard__date">
                {post.date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="newscard__title">{post.title}</div>
              {post.excerpt && <p className="newscard__excerpt">{post.excerpt}</p>}
            </div>
          </a>
        ))}
      </div>
    </Section>
  )
}
