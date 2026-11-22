import { useEffect, useState } from 'react';
import axios from 'axios';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import Navbar from '../components/Navbar';
import { formatDateTime } from '../utils/dateTime';

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('DEPOSIT_GUARD');
  const [inspections, setInspections] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Shared Property ID
  const [propertyId, setPropertyId] = useState('CHENNAI-2BHK-01');

  // DepositGuard state
  const [inspectionType, setInspectionType] = useState('MOVE_IN');
  const [room, setRoom] = useState('Living Room');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [items, setItems] = useState([]);

  // SplitRent state
  const [expenseTitle, setExpenseTitle] = useState('');
  const [category, setCategory] = useState('RENT');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitCount, setSplitCount] = useState(2);

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const role = userProfile?.role || 'TENANT';

  const fetchData = async () => {
    try {
      const inspSnap = await getDocs(
        query(collection(db, 'inspections'), orderBy('createdAt', 'desc'))
      );
      setInspections(inspSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      const inspSnap = await getDocs(collection(db, 'inspections'));
      setInspections(inspSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    try {
      const expSnap = await getDocs(
        query(collection(db, 'expenses'), orderBy('createdAt', 'desc'))
      );
      setExpenses(expSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      const expSnap = await getDocs(collection(db, 'expenses'));
      setExpenses(expSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!room.trim() || !note.trim()) return;
    setItems((prev) => [
      ...prev,
      { room: room.trim(), note: note.trim(), imageUrl: imageUrl.trim() || null },
    ]);
    setNote('');
    setImageUrl('');
  };

  const handleSealInspection = async () => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      const token = await user.getIdToken();
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/inspections/seal`,
        { propertyId: propertyId.trim(), type: inspectionType, items },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMessage(`Inspection sealed! SHA-256 Fingerprint: ${res.data.sha256Hash}`);
      setItems([]);
      await fetchData();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to seal inspection.');
    }
  };

  const handleApproveInspection = async (inspectionId) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      const token = await user.getIdToken();
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/inspections/approve/${inspectionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMessage('Inspection digitally countersigned by landlord.');
      await fetchData();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to countersign.');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');
    try {
      const token = await user.getIdToken();
      await axios.post(
        `${import.meta.env.VITE_API_URL}/expenses/add`,
        {
          propertyId: propertyId.trim(),
          title: expenseTitle.trim(),
          category,
          totalAmount: Number(totalAmount),
          splitCount: Number(splitCount),
          paidBy: userProfile?.name || user?.email,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMessage(`Added "${expenseTitle}" split among ${splitCount} flatmates.`);
      setExpenseTitle('');
      setTotalAmount('');
      await fetchData();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to add split expense.');
    }
  };

  const handleSettleExpense = async (expenseId) => {
    try {
      const token = await user.getIdToken();
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/expenses/settle/${expenseId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to settle expense.');
    }
  };

  const approvedCount = inspections.filter((i) => i.landlordApproved).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar connected to activeTab */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* KPI Summary Strip */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 grid grid-cols-3 divide-x divide-slate-200 text-center py-4">
          <div>
            <p className="text-xs text-slate-500">Logged In As</p>
            <p className="text-sm font-bold text-slate-800">
              {userProfile?.name || user?.email} ({role})
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Sealed Proofs</p>
            <p className="text-lg font-bold text-indigo-600">{inspections.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Landlord Verified</p>
            <p className="text-lg font-bold text-emerald-600">{approvedCount}</p>
          </div>
        </div>

        {/* Status / Error Alerts */}
        {statusMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm break-all">
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        {/* VIEW 1: DEPOSIT GUARD */}
        {activeTab === 'DEPOSIT_GUARD' && (
          <>
            {role === 'TENANT' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-800">
                  Create & Seal Move-In / Move-Out Proof
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Property ID
                    </label>
                    <input
                      type="text"
                      className="w-full border p-2.5 rounded-lg text-sm"
                      value={propertyId}
                      onChange={(e) => setPropertyId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Inspection Type
                    </label>
                    <select
                      className="w-full border p-2.5 rounded-lg text-sm bg-white"
                      value={inspectionType}
                      onChange={(e) => setInspectionType(e.target.value)}
                    >
                      <option value="MOVE_IN">MOVE_IN</option>
                      <option value="MOVE_OUT">MOVE_OUT</option>
                    </select>
                  </div>
                </div>

                <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Room (e.g., Bedroom, Kitchen)"
                    className="border p-2.5 rounded-lg text-sm"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Condition note (e.g., Wall paint clean)"
                    className="border p-2.5 rounded-lg text-sm"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Optional photo URL"
                      className="border p-2.5 rounded-lg text-sm flex-1"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium shrink-0"
                    >
                      Add Item
                    </button>
                  </div>
                </form>

                {items.length > 0 && (
                  <div className="border rounded-lg p-3 bg-slate-50 space-y-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase">
                      Queued Items ({items.length})
                    </p>
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="text-sm flex justify-between items-center bg-white p-2 rounded border"
                      >
                        <span>
                          <strong>{item.room}:</strong> {item.note}
                        </span>
                        <button
                          type="button"
                          onClick={() => setItems(items.filter((_, i) => i !== idx))}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleSealInspection}
                  disabled={items.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition"
                >
                  Seal Inspection with SHA-256
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">Sealed Proof Ledger</h2>
                <button
                  onClick={fetchData}
                  className="text-sm text-indigo-600 hover:underline font-medium"
                >
                  Refresh
                </button>
              </div>

              {inspections.length === 0 ? (
                <p className="text-sm text-slate-500">No sealed inspections yet.</p>
              ) : (
                <div className="space-y-3">
                  {inspections.map((docItem) => (
                    <div key={docItem.id} className="border rounded-xl p-4 space-y-2">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <span className="font-semibold text-slate-800">{docItem.propertyId}</span>{' '}
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {docItem.type}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            docItem.landlordApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {docItem.landlordApproved
                            ? 'Landlord Countersigned'
                            : 'Pending Landlord Sign-Off'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded break-all">
                        SHA-256: {docItem.sha256Hash}
                      </p>

                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          <strong>Sealed:</strong>{' '}
                          {formatDateTime(docItem.tenantSignedAt || docItem.createdAt)}
                        </span>
                        {docItem.landlordApproved && docItem.landlordSignedAt && (
                          <span className="text-emerald-700">
                            <strong>Countersigned:</strong> {formatDateTime(docItem.landlordSignedAt)}
                          </span>
                        )}
                      </div>

                      <ul className="text-sm text-slate-700 list-disc list-inside">
                        {(docItem.items || []).map((it, i) => (
                          <li key={i}>
                            <strong>{it.room}:</strong> {it.note}
                          </li>
                        ))}
                      </ul>

                      {role === 'LANDLORD' && !docItem.landlordApproved && (
                        <button
                          onClick={() => handleApproveInspection(docItem.id)}
                          className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                        >
                          Countersign Inspection
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW 2: SPLIT RENT */}
        {activeTab === 'SPLIT_RENT' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800">
                Split Rent, Security Deposit or Utility Bill
              </h2>

              <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Title (e.g., November Rent)"
                  className="border p-2.5 rounded-lg text-sm"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  required
                />
                <select
                  className="border p-2.5 rounded-lg text-sm bg-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="RENT">Monthly Rent</option>
                  <option value="DEPOSIT">Security Deposit</option>
                  <option value="UTILITY">EB / Wi-Fi / Water</option>
                </select>
                <input
                  type="number"
                  placeholder="Total Amount (₹)"
                  className="border p-2.5 rounded-lg text-sm"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Flatmates"
                    className="border p-2.5 rounded-lg text-sm w-24"
                    value={splitCount}
                    onChange={(e) => setSplitCount(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex-1"
                  >
                    Split
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Shared Expense Ledger</h2>
              {expenses.length === 0 ? (
                <p className="text-sm text-slate-500">No shared rent or deposit splits logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="border rounded-xl p-4 flex flex-wrap justify-between items-center gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{exp.title}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                            {exp.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Total: <strong>₹{exp.totalAmount}</strong> split across{' '}
                          <strong>{exp.splitCount}</strong> flatmates →{' '}
                          <span className="text-indigo-700 font-bold">
                            ₹{exp.perPersonShare} / person
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Paid by: {exp.paidBy} • {formatDateTime(exp.createdAt)}
                        </p>
                      </div>

                      {exp.settled ? (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                          Settled
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSettleExpense(exp.id)}
                          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                        >
                          Mark Settled
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}