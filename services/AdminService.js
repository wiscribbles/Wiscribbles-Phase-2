'use client';

/**
 * Admin data access.
 *
 * READS are still direct Firestore queries: `firestore.rules` allows an admin
 * to read these collections, and a listing carries no decision.
 *
 * WRITES all go through server routes. They used to be client writes against
 * collections the rules deny, which meant every one of them failed and the
 * pages showed a button that did nothing. The write side of this file is now
 * a thin client over `/api/admin/*`.
 */

import { db } from '@/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const SUBMISSIONS_COLLECTION = 'formSubmissions';
const PAYMENTS_COLLECTION = 'paymentTransactions';
const COMMISSIONER_APPLICATIONS_COLLECTION = 'commissionerApplications';

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

/**
 * Call a server route and surface the server's own message.
 *
 * Every write in this file used to go straight from the browser to Firestore,
 * against collections `firestore.rules` denies. They failed, the pages logged
 * the error, and the Website Manager saw buttons that did nothing. They go
 * through routes now; this is the one place that knows how a route reports a
 * refusal, so each caller does not reinvent it.
 */
const callRoute = async (url, { method = 'POST', body = null } = {}) => {
  const response = await fetch(url, {
    method,
    cache: 'no-store',
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    /* The server's message, not a generic one. These refusals are written to
       be read by the person who hit them — "Give a reason for the rejection"
       tells them what to do; "Request failed" does not. */
    const error = new Error(payload.message ?? `That did not go through (${response.status}).`);
    error.code = payload.error ?? 'request_failed';
    error.field = payload.field ?? null;
    error.status = response.status;
    throw error;
  }

  return payload;
};

/**
 * Phase 1 status strings → Phase 2 decisions.
 *
 * WHY THIS MAPS RATHER THAN WRITES. There is already one correct path to a
 * changed account status — `decidePartnerApplication`, behind
 * `/api/admin/partners` — and it does two things this file never did: it
 * validates that the account is actually a partner application, and it syncs
 * the custom claims that the security rules and every server guard read. The
 * old code here wrote `status` directly and left the claims alone, so an
 * account could read "approved" while still being locked out of everything.
 * A second path that happened to do the same things would drift from the
 * first the moment either changed, so there is only one.
 *
 * `active` is the Phase 1 name for what Phase 2 calls `approved`; it maps to
 * `reinstate` because that is the decision that returns an account to good
 * standing. `pending_review` maps to `request_info`, which is the only
 * decision that reopens an application for the applicant to amend.
 */
const DECISION_FOR_STATUS = Object.freeze({
  approved: 'approve',
  active: 'reinstate',
  rejected: 'reject',
  pending_review: 'request_info',
  suspended: 'suspend',
});

/** Decisions the reviewer must give a reason for, enforced server-side too. */
const NEEDS_REASON = new Set(['reject', 'request_info']);

export const updateUserStatus = async (userId, { status, notes = '' } = {}) => {
  if (!userId || !status) {
    throw new Error('User ID and status are required to update user status');
  }

  const decision = DECISION_FOR_STATUS[status];

  if (!decision) {
    throw new Error(
      `"${status}" is not a status that can be set from here. Use the partner ` +
        'review screen for anything else.',
    );
  }

  if (NEEDS_REASON.has(decision) && !String(notes).trim()) {
    /* Checked here as well as on the server so the page can prompt for the
       reason before spending a round trip on a refusal it can predict. */
    throw new Error(
      decision === 'reject'
        ? 'Give a reason for the rejection — the applicant is shown it.'
        : 'Say what further information is needed.',
    );
  }

  return callRoute('/api/admin/partners', {
    method: 'PATCH',
    body: { uid: userId, decision, feedback: String(notes).trim() || null },
  });
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

export const updateNotarizationStatus = async (submissionId, { status } = {}) => {
  if (!submissionId) {
    throw new Error('Submission ID is required to update notarization status');
  }

  /* Only the status. The old signature took an arbitrary `updates` object and
     spread it into the document, which on a route running with Admin
     credentials would write whatever keys arrived. `workflowStage` is set
     server-side alongside `status` so the two cannot drift. */
  return callRoute('/api/admin/notarizations', {
    method: 'PATCH',
    body: { submissionId, status },
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

/* `recordCommissionerApplication` was here and has been removed. Nothing in
   the codebase called it, it wrote to a collection the rules deny, and a
   Commissioner of Oaths application is created through the partner onboarding
   flow. Building a server route for a function with no caller would have been
   building a second, untested way to create an application. */

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

/**
 * PAYOUTS ARE NOT WIRED UP, AND THESE TWO REFUSE RATHER THAN PRETEND.
 *
 * Both used to write to `paymentTransactions` from the browser, against a
 * rule that denies it, so they already did nothing. They are not being given
 * server routes, and that is a decision rather than an omission:
 *
 *   - Payment collection is switched off pending the money-transmission
 *     question, so there is nothing to pay out of.
 *   - The answer to that question looks likely to be that the platform must
 *     never hold client funds at all — routing settlement through a licensed
 *     provider of record that pays the professional directly. That removes a
 *     licensing precondition in all four jurisdictions and an AML
 *     registration in two. If it is the route taken, a payout ledger owned by
 *     the platform is not the thing to build; a reconciliation view over the
 *     provider's records is.
 *   - Three of the four jurisdictions cap or fix notarial fees, and two
 *     prohibit paying anyone for procuring a retainer, so how money moves
 *     here is a question with a legal answer that nobody has yet.
 *
 * A clear refusal is therefore the correct behaviour, and it is strictly
 * better than the silent failure it replaces: the Website Manager now learns
 * why the button does nothing instead of wondering whether the click
 * registered.
 */
const PAYOUTS_OFF =
  'Payouts are not switched on yet. Payment collection is parked pending the ' +
  'money-transmission question, and how settlement works — most likely ' +
  'directly from a licensed provider to the professional, never through ' +
  'WiScribbles — has to be decided before a payout record means anything. ' +
  'Nothing was saved.';

export const recordPaymentTransaction = async () => {
  const error = new Error(PAYOUTS_OFF);
  error.code = 'payouts_disabled';
  throw error;
};

export const markPaymentAsProcessed = async () => {
  const error = new Error(PAYOUTS_OFF);
  error.code = 'payouts_disabled';
  throw error;
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

/**
 * Read and write go through the route: `adminSettings` is denied to clients
 * for both, and the defaults now live server-side in `lib/settings.js` so the
 * page and the server cannot disagree about what an unset value means.
 *
 * The response carries `noConsumerYet`, which the page displays. Nothing in
 * the product reads these settings — the write failing used to hide that;
 * fixing the write exposes it.
 */
export const fetchAdminSettings = async () => {
  const payload = await callRoute('/api/admin/settings', { method: 'GET' });
  return {
    ...payload.settings,
    __currencies: payload.currencies,
    __noConsumerYet: payload.noConsumerYet === true,
  };
};

export const updateAdminSettings = async (settings) => {
  const payload = await callRoute('/api/admin/settings', {
    method: 'PUT',
    body: { settings },
  });
  return payload.settings;
};

export default {
  fetchUsers,
  updateUserStatus,
  fetchNotarizationSubmissions,
  updateNotarizationStatus,
  fetchCommissionerApplications,
  fetchPaymentTransactions,
  recordPaymentTransaction,
  markPaymentAsProcessed,
  fetchAdminDashboardMetrics,
  fetchAdminSettings,
  updateAdminSettings,
};

