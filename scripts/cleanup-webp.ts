import { adminDb, adminStorage } from '../lib/firebase-admin';

async function deleteWebpFiles() {
  try {
    console.log('Fetching all files from Firebase Storage...');
    const bucket = adminStorage.bucket();
    const [files] = await bucket.getFiles({ prefix: 'originals/' });

    const webpFiles = files.filter(file => file.name.includes('.webp'));
    console.log(`Found ${webpFiles.length} WEBP files in storage`);

    if (webpFiles.length > 0) {
      console.log('Deleting WEBP files from storage...');
      for (const file of webpFiles) {
        await file.delete();
        console.log(`Deleted: ${file.name}`);
      }
    }

    console.log('\nDeleting Firestore records for WEBP images...');
    const snapshot = await adminDb.collection('processedImages').get();

    let deletedCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.originalPath && data.originalPath.includes('.webp')) {
        await doc.ref.delete();
        console.log(`Deleted Firestore doc: ${doc.id} - ${data.originalPath}`);
        deletedCount++;
      }
    }
    console.log(`\nDeleted ${deletedCount} Firestore records`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteWebpFiles();
