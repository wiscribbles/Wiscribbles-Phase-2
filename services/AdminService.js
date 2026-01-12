'use client';

import { db, auth } from '@/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const SUBMISSIONS_COLLECTION = 'formSubmissions';
const PAYMENTS_COLLECTION = 'paymentTransactions';
const COMMISSIONER_APPLICATIONS_COLLECTION = 'commissionerApplications';
const ADMIN_SETTINGS_DOC = 'adminSettings/global';

const buildQueryWithFilters = (baseCollection, filters = [], sort = null, limitValue = null) => {
  const clauses = [collection(db, baseCollection)];

  filters
    .filter(Boolean)
    .forEach((filter) => clauses.push(where(filter.field, filter.operator, filter.value)));

  if (sort) {
    clauses.push(orderBy(sort.field, sort.direction ?? 'desc'));
  }

  if (limitValue) {
    clauses.push(firestoreLimit(limitValue));
  }

  return query(...clauses);
};

export const fetchUsers = async ({
  role,
  status,
  limit: limitValue = 100,
  sortBy = 'createdAt',
  sortDirection = 'desc',
} = {}) => {
  const filters = [];

  if (role && role !== 'all') {
    filters.push({ field: 'role', operator: '==', value: role });
  }

  if (status && status !== 'all') {
    filters.push({ field: 'status', operator: '==', value: status });
  }

  const shouldSortClientSide = Boolean(sortBy) && filters.length > 0;

  const builtQuery = buildQueryWithFilters(
    USERS_COLLECTION,
    filters,
    shouldSortClientSide ? null : sortBy ? { field: sortBy, direction: sortDirection } : null,
    limitValue,
  );

  const snapshot = await getDocs(builtQuery);

  const users = snapshot.docs.map((userDoc) => ({
    id: userDoc.id,
    ...userDoc.data(),
  }));

  if (shouldSortClientSide) {
    users.sort((a, b) => {
      const aValue = a[sortBy] ?? '';
      const bValue = b[sortBy] ?? '';
      if (aValue === bValue) return 0;
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }

  return limitValue ? users.slice(0, limitValue) : users;
};

export const updateUserStatus = async (userId, { status, reviewerId, notes = '' }) => {
  if (!userId || !status) {
    throw new Error('User ID and status are required to update user status');
  }

  const now = new Date().toISOString();

  const updates = {
    status,
    reviewerId: reviewerId ?? auth.currentUser?.uid ?? null,
    reviewNotes: notes,
    updatedAt: now,
  };

  if (status === 'approved') {
    updates.approvedAt = now;
    updates.rejectedAt = null;
  } else if (status === 'rejected') {
    updates.rejectedAt = now;
    updates.approvedAt = null;
  }

  await updateDoc(doc(db, USERS_COLLECTION, userId), updates);
};

export const fetchNotarizationSubmissions = async ({
  status,
  limit: limitValue = 100,
  includeCompleted = true,
} = {}) => {
  const filters = [{ field: 'type', operator: '==', value: 'notary' }];

  const hasExplicitStatusFilter = Boolean(status && status !== 'all');
  const usesInFilter = !hasExplicitStatusFilter && !includeCompleted;

  if (status && status !== 'all') {
    filters.push({ field: 'status', operator: '==', value: status });
  } else if (!includeCompleted) {
    filters.push({ field: 'status', operator: 'in', value: ['pending', 'assigned', 'in_progress'] });
  }

  const shouldSortClientSide = hasExplicitStatusFilter || usesInFilter;

  const submissionsQuery = buildQueryWithFilters(
    SUBMISSIONS_COLLECTION,
    filters,
    shouldSortClientSide ? null : { field: 'submittedAt', direction: 'desc' },
    limitValue,
  );

  const snapshot = await getDocs(submissionsQuery);

  const submissions = snapshot.docs.map((submissionDoc) => ({
    id: submissionDoc.id,
    ...submissionDoc.data(),
  }));

  if (shouldSortClientSide) {
    submissions.sort((a, b) => {
      const aDate = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }

  return limitValue ? submissions.slice(0, limitValue) : submissions;
};

export const updateNotarizationStatus = async (submissionId, updates = {}) => {
  if (!submissionId) {
    throw new Error('Submission ID is required to update notarization status');
  }

  await updateDoc(doc(db, SUBMISSIONS_COLLECTION, submissionId), {
    ...updates,
    lastUpdatedAt: new Date().toISOString(),
  });
};

export const fetchCommissionerApplications = async ({
  status,
  limit: limitValue = 100,
} = {}) => {
  const filters = [];

  if (status && status !== 'all') {
    filters.push({ field: 'status', operator: '==', value: status });
  }

  const shouldSortClientSide = filters.length > 0;

  const applicationsQuery = buildQueryWithFilters(
    COMMISSIONER_APPLICATIONS_COLLECTION,
    filters,
    shouldSortClientSide ? null : { field: 'submittedAt', direction: 'desc' },
    limitValue,
  );

  const snapshot = await getDocs(applicationsQuery);

  const applications = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  if (shouldSortClientSide) {
    applications.sort((a, b) => {
      const aDate = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }

  return limitValue ? applications.slice(0, limitValue) : applications;
};

export const recordCommissionerApplication = async (payload) => {
  const collectionRef = collection(db, COMMISSIONER_APPLICATIONS_COLLECTION);
  await addDoc(collectionRef, {
    ...payload,
    status: payload.status ?? 'pending_review',
    submittedAt: payload.submittedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

export const fetchPaymentTransactions = async ({
  recipientRole,
  status,
  limit: limitValue = 100,
} = {}) => {
  const filters = [];

  if (recipientRole && recipientRole !== 'all') {
    filters.push({ field: 'recipientRole', operator: '==', value: recipientRole });
  }

  if (status && status !== 'all') {
    filters.push({ field: 'status', operator: '==', value: status });
  }

  const shouldSortClientSide = filters.length > 0;

  const transactionsQuery = buildQueryWithFilters(
    PAYMENTS_COLLECTION,
    filters,
    shouldSortClientSide ? null : { field: 'createdAt', direction: 'desc' },
    limitValue,
  );

  const snapshot = await getDocs(transactionsQuery);

  const transactions = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  if (shouldSortClientSide) {
    transactions.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }

  return limitValue ? transactions.slice(0, limitValue) : transactions;
};

export const recordPaymentTransaction = async (transaction) => {
  const collectionRef = collection(db, PAYMENTS_COLLECTION);
  await addDoc(collectionRef, {
    ...transaction,
    status: transaction.status ?? 'scheduled',
    createdAt: transaction.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    processedAt: transaction.processedAt ?? null,
  });
};

export const markPaymentAsProcessed = async (transactionId, updates = {}) => {
  if (!transactionId) {
    throw new Error('Transaction ID is required to update payment');
  }

  await updateDoc(doc(db, PAYMENTS_COLLECTION, transactionId), {
    ...updates,
    status: updates.status ?? 'completed',
    processedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

export const fetchAdminDashboardMetrics = async () => {
  const [
    pendingNotarySubmissions,
    activeUsers,
    pendingUsers,
    pendingPayments,
  ] = await Promise.all([
    fetchNotarizationSubmissions({ status: 'pending', limit: 200 }),
    fetchUsers({ status: 'active', limit: 200, sortBy: null }),
    fetchUsers({ status: 'pending_review', limit: 200, sortBy: null }),
    fetchPaymentTransactions({ status: 'scheduled', limit: 200 }),
  ]);

  const isAdmin = (user) => (user.role || user.signUpAs || '').toLowerCase() === 'admin';

  return {
    pendingNotarizations: pendingNotarySubmissions.length,
    activeUsers: activeUsers.filter((user) => !isAdmin(user)).length,
    pendingUsers: pendingUsers.filter((user) => !isAdmin(user)).length,
    pendingPayments: pendingPayments.length,
  };
};

export const fetchAdminSettings = async () => {
  const settingsRef = doc(db, ADMIN_SETTINGS_DOC);
  const snapshot = await getDoc(settingsRef);
  if (snapshot.exists()) {
    return snapshot.data();
  }
  return {
    autoAssignNotaries: false,
    autoApproveAttorneys: false,
    notifyOnLargePayments: true,
    largePaymentThreshold: 1000,
    defaultPayoutCurrency: 'USD',
  };
};

export const updateAdminSettings = async (settings) => {
  const settingsRef = doc(db, ADMIN_SETTINGS_DOC);
  await setDoc(
    settingsRef,
    {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid ?? null,
    },
    { merge: true },
  );
};

export default {
  fetchUsers,
  updateUserStatus,
  fetchNotarizationSubmissions,
  updateNotarizationStatus,
  fetchCommissionerApplications,
  recordCommissionerApplication,
  fetchPaymentTransactions,
  recordPaymentTransaction,
  markPaymentAsProcessed,
  fetchAdminDashboardMetrics,
  fetchAdminSettings,
  updateAdminSettings,
};

