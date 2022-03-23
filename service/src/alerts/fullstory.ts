import fs from 'fs'

/**
 * We store a fullstory session url on disk to persist across the session.
 *
 * TODO: This should be abstracted so we can persist general browser session metadata.
 */
export async function getFullStoryUrl() {
    try {
        const fullStoryUrl = await fs.promises.readFile('/tmp/fullStoryUrl.txt', 'utf-8')
        await fs.promises.unlink('/tmp/fullStoryUrl.txt')
        return fullStoryUrl
    } catch (e) {
        return 'ERROR: No FullStory URL found.'
    }
}
