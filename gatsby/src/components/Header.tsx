import { Link } from 'gatsby'
import * as React from 'react'

const Header: React.FC<{ siteTitle: string }> = ({ siteTitle = '' }) => (
    <header
        style={{
            background: '#ff8926',
            marginBottom: '1.45rem',
        }}
    >
        <div
            style={{
                margin: '0 auto',
                maxWidth: 960,
                padding: '1.45rem 1.0875rem',
            }}
        >
            <h1 style={{ margin: 0 }}>
                <Link
                    to="/"
                    style={{
                        color: '#232129',
                        textDecoration: 'none',
                    }}
                >
                    {siteTitle}
                </Link>
            </h1>
            <a
                href="https://github.com/tophat/sanity-runner"
                style={{ color: '#232129' }}
                rel="noreferrer"
            >
                View GitHub Project
            </a>
        </div>
        <nav className="header-nav">
            <ul>
                <li>
                    <Link to="/" activeClassName="active">
                        Home
                    </Link>
                </li>
                <li>
                    <Link to="/getting-started" activeClassName="active">
                        Getting Started
                    </Link>
                </li>
                <li>
                    <Link to="/configuration" activeClassName="active">
                        Configuration
                    </Link>
                </li>
                <li>
                    <Link to="/plugins" activeClassName="active">
                        Plugins
                    </Link>
                </li>
                <li>
                    <Link to="/architecture" activeClassName="active">
                        Architecture
                    </Link>
                </li>
                <li>
                    <Link to="/faq" activeClassName="active">
                        FAQ
                    </Link>
                </li>
                <li>
                    <Link to="/contributing" activeClassName="active">
                        Contributing
                    </Link>
                </li>
            </ul>
        </nav>
    </header>
)

export default Header
