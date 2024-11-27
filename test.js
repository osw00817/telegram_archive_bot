const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://SANJINI:${process.env.DB_PASSWORD}@cluster.dfgw5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function insertArchive(course, professor, title) {
  try {
    await client.connect();
    const database = client.db("archive");
    const collection = database.collection("archive_list");

    const document = { course, professor, title };
    const result = await collection.insertOne(document);
    console.log(`Document inserted with _id: ${result.insertedId}`);
  } catch (error) {
    console.error("Error inserting document:", error);
  } finally {
    await client.close();
  }
}

async function getOrganizedArchives() {
    try {
      await client.connect();
      const database = client.db("archive");
      const collection = database.collection("archive_list");
  
      // Fetch all documents
      const documents = await collection.find({}).toArray();
  
      // Organize by course
      const organizedData = documents.reduce((acc, doc) => {
        const { course, professor, title } = doc;
        const entry = `${professor}_${title}`;
        if (!acc[course]) {
          acc[course] = [];
        }
        acc[course].push(entry);
        return acc;
      }, {});
  
      // Build the formatted message
      let msg = "";
      for (const [course, entries] of Object.entries(organizedData)) {
        msg += `[${course}]\n`;
        entries.forEach(entry => {
          msg += `${entry}\n`;
        });
        msg += `\n`; // Add a blank line for separation
      }
  
      console.log(msg); // Log the message for verification
      return msg;
    } catch (error) {
      console.error("Error fetching and organizing documents:", error);
    } finally {
      await client.close();
    }
  }

// Example usage
(async () => {
  // Insert a document
  await insertArchive("CS102", "전상률", "Introduction to Computer Science");

  // Fetch all documents
  const msg = await getOrganizedArchives();
  console.log("Final Message:\n", msg); // Output the final message
})();
