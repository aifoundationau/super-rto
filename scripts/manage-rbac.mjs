import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const secretPath = path.resolve(__dirname, '../secrets/service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(secretPath, 'utf8'));

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || 'ai-foundation-firebase',
    });

const db = getFirestore(app);

const action = process.argv[2]; // 'save', 'list', 'get'
const roleId = process.argv[3];
const roleDataJson = process.argv[4];

async function main() {
  if (action === 'save') {
    if (!roleId || !roleDataJson) {
      console.error('Usage: node scripts/manage-rbac.mjs save <roleId> <jsonData>');
      process.exit(1);
    }
    const data = JSON.parse(roleDataJson);
    await db.collection('roles').doc(roleId).set({
      ...data,
      roleId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`✅ Role "${roleId}" persisted successfully to Firestore /roles/${roleId}`);
    const saved = await db.collection('roles').doc(roleId).get();
    console.log('Stored Data:', JSON.stringify(saved.data(), null, 2));
  } else if (action === 'list') {
    const snap = await db.collection('roles').get();
    console.log(`Roles count: ${snap.size}`);
    snap.forEach((doc) => {
      console.log(`- ${doc.id}: ${JSON.stringify(doc.data().permissions)}`);
    });
  } else if (action === 'get') {
    const doc = await db.collection('roles').doc(roleId).get();
    if (!doc.exists) {
      console.log(`Role ${roleId} not found`);
    } else {
      console.log(JSON.stringify(doc.data(), null, 2));
    }
  } else {
    console.log('Commands: save <roleId> <json>, list, get <roleId>');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
