/**
 * The smallest Firestore fake that supports the queries under test.
 *
 * Deliberately NOT a general-purpose emulator. It implements `collection()` →
 * `doc()`/`where()`/`limit()`/`get()`, document `get`/`set`/`update`, and
 * `runTransaction`. Anything else throws, so a test that drifts beyond what
 * this honestly models fails rather than passing against a half-truth.
 *
 * ON TRANSACTIONS, BECAUSE IT MATTERS FOR WHAT THE QUEUE TESTS CAN CLAIM:
 * `runTransaction` here runs the callback once against the live store. It
 * models the SUCCESSFUL path. It cannot reproduce Firestore's contention
 * retry, so it cannot prove that two genuinely simultaneous claims serialise —
 * only Firestore can do that, and only against a real project. What it CAN
 * prove is the property the code is responsible for: that the claim re-reads
 * status inside the transaction and refuses an entry already taken. A guard
 * that read status outside the transaction would pass a naive test and fail
 * here, because the second call sees the first call's write.
 */

const matches = (data, clauses) =>
  clauses.every(([field, op, value]) => {
    const actual = field.split('.').reduce((o, k) => o?.[k], data);
    if (op === '==') return actual === value;
    if (op === '!=') return actual !== value;
    if (op === '>=') return actual >= value;
    if (op === '<=') return actual <= value;
    if (op === '>') return actual > value;
    if (op === '<') return actual < value;
    if (op === 'in') return Array.isArray(value) && value.includes(actual);
    if (op === 'array-contains') return Array.isArray(actual) && actual.includes(value);
    throw new Error(`fake Firestore does not implement the "${op}" operator`);
  });

const snapshotOf = (id, data) => ({
  id,
  exists: data !== undefined,
  data: () => (data === undefined ? undefined : structuredClone(data)),
});

export function createFirestore(seed = {}) {
  /* Shape: { collectionName: { docId: data } } */
  const store = structuredClone(seed);
  const writes = [];

  const read = (name, id) => store[name]?.[id];

  const write = (name, id, data, { merge = false, op = 'set' } = {}) => {
    store[name] ??= {};
    store[name][id] = merge
      ? { ...store[name][id], ...structuredClone(data) }
      : structuredClone(data);
    writes.push({ op, collection: name, id, data: structuredClone(data) });
  };

  const docRef = (name, id) => ({
    /* Identity the transaction uses. Real DocumentReferences carry the same
       information under different names. */
    __collection: name,
    __id: id,
    id,
    get: async () => snapshotOf(id, read(name, id)),
    set: async (data, options) => write(name, id, data, { merge: !!options?.merge }),
    update: async (data) => {
      if (read(name, id) === undefined) {
        throw new Error(`fake Firestore: update on missing ${name}/${id}`);
      }
      write(name, id, data, { merge: true, op: 'update' });
    },
  });

  const query = (name, clauses = [], max = Infinity) => ({
    where: (field, op, value) => query(name, [...clauses, [field, op, value]], max),
    orderBy: () => query(name, clauses, max),
    limit: (n) => query(name, clauses, n),
    get: async () => {
      const docs = Object.entries(store[name] ?? {})
        .filter(([, data]) => matches(data, clauses))
        .slice(0, max)
        .map(([id, data]) => snapshotOf(id, data));
      return {
        empty: docs.length === 0,
        size: docs.length,
        docs,
        forEach: (f) => docs.forEach(f),
      };
    },
  });

  return {
    collection: (name) => ({
      doc: (id) => docRef(name, id),
      where: (field, op, value) => query(name, [[field, op, value]]),
      orderBy: () => query(name),
      limit: (n) => query(name, [], n),
      get: () => query(name).get(),
      add: async (data) => {
        const id = `generated-${Object.keys(store[name] ?? {}).length + 1}`;
        write(name, id, data, { op: 'add' });
        return docRef(name, id);
      },
    }),

    runTransaction: async (fn) =>
      fn({
        get: async (ref) => snapshotOf(ref.__id, read(ref.__collection, ref.__id)),
        set: (ref, data, options) =>
          write(ref.__collection, ref.__id, data, {
            merge: !!options?.merge,
            op: 'tx:set',
          }),
        update: (ref, data) =>
          write(ref.__collection, ref.__id, data, { merge: true, op: 'tx:update' }),
      }),

    /* Test helpers, not part of the Firestore surface. */
    __store: store,
    __writes: writes,
  };
}
