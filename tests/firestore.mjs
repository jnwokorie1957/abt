import fs from 'node:fs';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({ projectId: 'demo-abt', firestore: { host: '127.0.0.1', port: 8085, rules: fs.readFileSync('firestore.rules', 'utf8') } });
let checks = 0;
try {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'join_submissions/private-inquiry'), { name: 'Private', email: 'private@example.test' });
  });
  const contexts = [env.unauthenticatedContext(), env.authenticatedContext('alice'), env.authenticatedContext('bob'), env.authenticatedContext('self-declared-admin', { admin: true })];
  for (const context of contexts) {
    const db = context.firestore();
    await assertFails(getDoc(doc(db, 'join_submissions/private-inquiry'))); checks++;
    await assertFails(getDocs(collection(db, 'join_submissions'))); checks++;
    await assertFails(setDoc(doc(db, 'join_submissions/new'), { name: 'Injected', email: 'injected@example.test', admin: true })); checks++;
    await assertFails(updateDoc(doc(db, 'join_submissions/private-inquiry'), { email: 'changed@example.test' })); checks++;
    await assertFails(deleteDoc(doc(db, 'join_submissions/private-inquiry'))); checks++;
    await assertFails(setDoc(doc(db, 'users/alice'), { admin: true })); checks++;
    await assertFails(setDoc(doc(db, 'join_submissions/private-inquiry/nested/child'), { role: 'admin' })); checks++;
  }
  console.log(`Passed ${checks} denial checks: unauthenticated, signed-in, cross-user, admin-claim, list, create, update, delete, privilege injection, nested paths.`);
} finally { await env.cleanup(); }
