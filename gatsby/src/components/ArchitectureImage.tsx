import { StaticImage } from 'gatsby-plugin-image'
import React from 'react'

export default function ArchitectureImage() {
    return (
        <StaticImage
            src="../images/architecture.png"
            alt="Architecture Diagram"
            layout="constrained"
        />
    )
}
