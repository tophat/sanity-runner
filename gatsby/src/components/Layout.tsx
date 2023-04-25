import { MDXProvider } from '@mdx-js/react'
import { graphql, useStaticQuery } from 'gatsby'
import * as React from 'react'
import 'sanitize.css'

import CodeBlock from './CodeBlock'
import Header from './Header'
import Seo from './Seo'
import './layout.css'

const components = {
    code: CodeBlock,
}

interface PageContext {
    frontmatter: {
        path: string
        title: string
    }
}

export const Layout: React.FC<{
    children?: React.ReactNode
    pageContext?: PageContext
}> = ({ children, pageContext }) => {
    const data = useStaticQuery(graphql`
        query SiteTitleQuery {
            site {
                siteMetadata {
                    title
                }
            }
        }
    `)

    return (
        <MDXProvider components={components}>
            <Seo title={pageContext?.frontmatter?.title || 'Sanity Runner'} />
            <Header siteTitle={data.site.siteMetadata?.title} />
            <div
                style={{
                    margin: '0 auto',
                    maxWidth: 960,
                    padding: '0 1.0875rem 1.45rem',
                }}
            >
                <main>{children}</main>
                <hr />
                <footer
                    style={{
                        marginTop: '2rem',
                    }}
                >
                    <a href="https://opensource.tophat.com/" rel="noreferrer" target="_blank">
                        Top Hat Open Source
                    </a>{' '}
                    © {new Date().getFullYear()}
                </footer>
            </div>
        </MDXProvider>
    )
}

export default Layout
