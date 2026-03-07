export async function getCourseName(prefix: string, number: string): Promise<string> {
    const apiKey = process.env.NEBULA_API_KEY;

    if (!apiKey) {
        console.error("NEBULA_API_KEY environment variable is not set.");
        return "";
    }

    const url = `https://api.utdnebula.com/course?subject_prefix=${encodeURIComponent(prefix)}&course_number=${encodeURIComponent(number)}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-api-key": apiKey,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            console.error(`Nebula API request failed with status: ${response.status}`);
            return "";
        }

        const json = await response.json();

        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
            // Courses are returned as an array, return the title of the first match
            // Typically the array is sorted by catalog year, so the last element 
            // might be the most recent. The first element works fine too.
            // Let's get the one with the highest catalog year to be safe,
            // or just the last element in the array which seems to be 2025.
            const latestCourse = json.data[json.data.length - 1];
            return latestCourse.title ? latestCourse.title.trim() : "";
        }

        return "";
    } catch (error) {
        console.error("Error fetching course from Nebula API:", error);
        return "";
    }
}