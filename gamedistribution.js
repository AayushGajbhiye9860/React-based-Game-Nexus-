export async function fetchGames(amount = 50) {
    try {
        const response = await fetch(
            `https://catalog.api.gamedistribution.com/api/v2.0/rss/All/?amount=${amount}&format=json`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching games from GameDistribution:", error);
        return [];
    }
}

export async function searchGames(query, amount = 120) {
    // GameDistribution doesn't have a direct search endpoint in this public RSS format,
    // so we fetch a larger chunk and filter manually by title or category.
    const allGames = await fetchGames(amount);

    if (!query) return allGames.slice(0, 50);

    const lowerQuery = query.toLowerCase();
    return allGames.filter(game =>
        game.Title.toLowerCase().includes(lowerQuery) ||
        (game.Category && game.Category.some(c => c.toLowerCase().includes(lowerQuery))) ||
        (game.Tag && game.Tag.some(t => t.toLowerCase().includes(lowerQuery)))
    ).slice(0, 50); // Return up to 50 matches
}
