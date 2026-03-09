"use client";

import React, { useState } from "react";

import {

  createOrUpdateInvoiceDeadlineSetting,

  createCategory,

  updateCategory,

  deleteCategory,

  createCategoryBundle,

  updateCategoryBundle,

  deleteCategoryBundle,

  assignCategoryToBundle,

  unassignCategoryFromBundle,

} from "@/app/actions";

import { invoiceRecurrenceEnum } from "@/db/schema"; // Assuming this enum is accessible client-side

import { useRouter } from "next/navigation";



type RecurrenceType = typeof invoiceRecurrenceEnum.enumValues[number];



interface DeadlineSetting {



  id: string;



  recurrence: RecurrenceType;



  customIntervalDays: number | null;



  startDate: Date | null;



  billingPeriodLengthDays: number | null;



  billingPeriodEndOffsetDays: number | null;



  paymentOffsetDays: number | null;



}







interface Category {







  id: string;







  name: string;







}















interface CategoryBundle {







  id: string;







  name: string;







  categories: { category: Category }[];







}















interface AdminSettingsClientProps {







  initialDeadlineSettings: DeadlineSetting[];







  initialCategories: Category[];







  initialCategoryBundles: CategoryBundle[];







}



export default function AdminSettingsClient({



  initialDeadlineSettings,



  initialCategories,



  initialCategoryBundles,



}: AdminSettingsClientProps) {



  const router = useRouter();



  const [deadlineSettings, setDeadlineSettings] = useState<DeadlineSetting[]>(



    initialDeadlineSettings



  );



  const [categories, setCategories] = useState<Category[]>(initialCategories);



  const [categoryBundles, setCategoryBundles] = useState<CategoryBundle[]>(initialCategoryBundles);







  React.useEffect(() => {



    setDeadlineSettings(initialDeadlineSettings);



    setCategories(initialCategories);



    setCategoryBundles(initialCategoryBundles);



  }, [initialDeadlineSettings, initialCategories, initialCategoryBundles]);

  // State for new deadline setting form
  const [newRecurrence, setNewRecurrence] = useState<RecurrenceType>("MONTHLY");
  const [newCustomInterval, setNewCustomInterval] = useState<number | undefined>(
    undefined
  );
  const [newStartDate, setNewStartDate] = useState<string>("");
  const [newBillingPeriodLengthDays, setNewBillingPeriodLengthDays] = useState<number | undefined>(undefined);
  const [newBillingPeriodEndOffsetDays, setNewBillingPeriodEndOffsetDays] = useState<number | undefined>(undefined);
  const [newPaymentOffsetDays, setNewPaymentOffsetDays] = useState<number | undefined>(undefined);


  // Category management states
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Category Bundle management states
  const [newBundleName, setNewBundleName] = useState<string>("");
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);
  const [editingBundleName, setEditingBundleName] = useState<string>("");
  const [bundleError, setBundleError] = useState<string | null>(null);

  const handleSaveDeadlineSetting = async () => {
    try {
      await createOrUpdateInvoiceDeadlineSetting({
        recurrence: newRecurrence,
        customIntervalDays: newCustomInterval,
        startDate: newStartDate ? new Date(newStartDate) : undefined,
        billingPeriodLengthDays: newBillingPeriodLengthDays,
        billingPeriodEndOffsetDays: newBillingPeriodEndOffsetDays,
        paymentOffsetDays: newPaymentOffsetDays,
      });
      // Re-fetch or update state
      // For simplicity, let's just alert for now, in a real app you'd re-fetch or update state more robustly
      alert("Deadline setting saved!");
      router.refresh();
      // Reset form
      setNewRecurrence("MONTHLY");
      setNewCustomInterval(undefined);
      setNewStartDate("");
      setNewBillingPeriodLengthDays(undefined);
      setNewBillingPeriodEndOffsetDays(undefined);
      setNewPaymentOffsetDays(undefined);
    } catch (error: any) {
      alert(`Error saving deadline setting: ${error.message}`);
        }
      };
    
      const handleAddCategory = async () => {
        try {
          setCategoryError(null);
          await createCategory(newCategoryName);
          router.refresh(); // Revalidate to fetch updated category list
          setNewCategoryName("");
        } catch (error: any) {
          setCategoryError(error.message || "Failed to add category.");
        }
      };
    
      const handleUpdateCategory = async (id: string) => {
        try {
          setCategoryError(null);
          await updateCategory(id, editingCategoryName);
          router.refresh(); // Revalidate to fetch updated category list
          setEditingCategoryId(null);
          setEditingCategoryName("");
        } catch (error: any) {
          setCategoryError(error.message || "Failed to update category.");
        }
      };
    
      const handleDeleteCategory = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category? It will be removed from all bundles.")) return;
        try {
          setCategoryError(null);
          await deleteCategory(id);
          router.refresh(); // Revalidate to fetch updated category list
        } catch (error: any) {
          setCategoryError(error.message || "Failed to delete category. Ensure it's not in use by any invoice items.");
        }
      };
    
      // Category Bundle Handlers
      const handleAddBundle = async () => {
        try {
          setBundleError(null);
          await createCategoryBundle(newBundleName);
          router.refresh();
          setNewBundleName("");
        } catch (error: any) {
          setBundleError(error.message || "Failed to add bundle.");
        }
      };
    
      const handleUpdateBundle = async (id: string) => {
        try {
          setBundleError(null);
          await updateCategoryBundle(id, editingBundleName);
          router.refresh();
          setEditingBundleId(null);
          setEditingBundleName("");
        } catch (error: any) {
          setBundleError(error.message || "Failed to update bundle.");
        }
      };
    
      const handleDeleteBundle = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category bundle? It will also unassign all categories and users.")) return;
        try {
          setBundleError(null);
          await deleteCategoryBundle(id);
          router.refresh();
        } catch (error: any) {
          setBundleError(error.message || "Failed to delete bundle.");
        }
      };
    
      const handleAssignCategory = async (bundleId: string, categoryId: string) => {
        try {
          setBundleError(null);
          await assignCategoryToBundle(bundleId, categoryId);
          router.refresh();
        } catch (error: any) {
          setBundleError(error.message || "Failed to assign category to bundle.");
        }
      };
    
      const handleUnassignCategory = async (bundleId: string, categoryId: string) => {
        try {
          setBundleError(null);
          await unassignCategoryFromBundle(bundleId, categoryId);
          router.refresh();
        } catch (error: any) {
          setBundleError(error.message || "Failed to unassign category from bundle.");
        }
      };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-black mb-4">Admin Settings</h1>



      {/* Invoice Deadline Settings */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-black mb-4">
          Automated Payroll Schedule Settings
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure a global payroll schedule. This automatically dictates what dates contractors can choose for their invoices, and what billing periods they are allowed to select for their hours.
        </p>
        <div className="mb-4">
          {deadlineSettings.map((setting) => (
            <div key={setting.id} className="mb-2 p-4 border rounded bg-slate-50">
              <div className="font-semibold text-lg mb-2">Current Schedule: {setting.recurrence}</div>
              <ul className="text-sm text-slate-700 space-y-1">
                <li><span className="font-medium">First Invoice Date:</span> {setting.startDate ? new Date(setting.startDate).toLocaleDateString() : 'Not Set'}</li>
                {setting.recurrence === "CUSTOM" && <li><span className="font-medium">Every:</span> {setting.customIntervalDays} days</li>}
                <li><span className="font-medium">Billing Period Length:</span> {setting.billingPeriodLengthDays || 0} days</li>
                <li><span className="font-medium">Billing Period Ends:</span> {setting.billingPeriodEndOffsetDays || 0} days before the invoice date</li>
              </ul>
            </div>
          ))}
          {deadlineSettings.length === 0 && <p className="text-sm text-slate-500 italic">No automated schedule configured.</p>}
        </div>
        
        <h3 className="text-lg font-medium text-black mb-3 border-t border-slate-200 pt-4">
          {deadlineSettings.length > 0 ? "Update Schedule" : "Create Schedule"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1">First Invoice Date</label>
            <input
              type="date"
              className="border p-2 rounded outline-none focus:ring-2 focus:ring-nreuv-accent"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Frequency</label>
            <select
              className="border p-2 rounded outline-none focus:ring-2 focus:ring-nreuv-accent bg-white"
              value={newRecurrence}
              onChange={(e) => setNewRecurrence(e.target.value as RecurrenceType)}
            >
              {invoiceRecurrenceEnum.enumValues.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {newRecurrence === "CUSTOM" && (
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Custom Frequency (Days)</label>
              <input
                type="number"
                min="1"
                className="border p-2 rounded outline-none focus:ring-2 focus:ring-nreuv-accent"
                value={newCustomInterval || ""}
                onChange={(e) => setNewCustomInterval(parseInt(e.target.value) || undefined)}
              />
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Billing Period Length (Days)</label>
            <input
              type="number"
              min="1"
              placeholder="e.g., 14 for two weeks"
              className="border p-2 rounded outline-none focus:ring-2 focus:ring-nreuv-accent"
              value={newBillingPeriodLengthDays || ""}
              onChange={(e) => setNewBillingPeriodLengthDays(parseInt(e.target.value) || undefined)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Billing Ends X Days Before Invoice</label>
            <input
              type="number"
              min="0"
              placeholder="e.g., 5"
              className="border p-2 rounded outline-none focus:ring-2 focus:ring-nreuv-accent"
              value={newBillingPeriodEndOffsetDays || ""}
              onChange={(e) => setNewBillingPeriodEndOffsetDays(parseInt(e.target.value) || undefined)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Payment X Days After Invoice</label>
            <input
              type="number"
              min="0"
              placeholder="e.g., 7"
              className="border p-2 rounded outline-none focus:ring-2 focus:ring-nreuv-accent"
              value={newPaymentOffsetDays || ""}
              onChange={(e) => setNewPaymentOffsetDays(parseInt(e.target.value) || undefined)}
            />
          </div>
        </div>

        <button
          onClick={handleSaveDeadlineSetting}
          className="bg-nreuv-primary hover:opacity-90 text-white font-bold py-2 px-6 rounded transition-colors"
        >
          Save Automated Schedule
        </button>
      </div>

      {/* Category Management */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-black mb-4">Category Management</h2>
        
        {categoryError && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
            {categoryError}
          </div>
        )}

        <div className="mb-4">
          {categories.map((cat) => (
            <div key={cat.id} className="mb-2 p-2 border rounded flex justify-between items-center bg-gray-50">
              {editingCategoryId === cat.id ? (
                <input
                  type="text"
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  className="border p-1 rounded flex-1 mr-2"
                />
              ) : (
                <span className="font-semibold">{cat.name}</span>
              )}
              
              <div className="flex gap-2">
                {editingCategoryId === cat.id ? (
                  <>
                    <button
                      onClick={() => handleUpdateCategory(cat.id)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                      disabled={!editingCategoryName.trim()}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategoryId(null)}
                      className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingCategoryId(cat.id);
                        setEditingCategoryName(cat.name);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-gray-500 italic text-sm">No categories defined yet.</p>
          )}
        </div>

        <h3 className="text-lg font-medium text-black mb-2 border-t border-slate-200 pt-4">Add New Category</h3>
        <div className="flex gap-2">
          <input
            type="text"
            className="border p-2 rounded flex-1"
            placeholder="New Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button
            onClick={handleAddCategory}
            className="bg-nreuv-primary hover:opacity-90 text-white font-bold py-2 px-4 rounded"
            disabled={!newCategoryName.trim()}
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Category Bundle Management */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-black mb-4">Category Bundle Management</h2>
        <p className="text-sm text-gray-600 mb-4">
          Group categories into bundles and assign them to users. Users will only be able to select categories from their assigned bundles.
        </p>
        
        {bundleError && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
            {bundleError}
          </div>
        )}

        <div className="mb-4">
          {categoryBundles.map((bundle) => (
            <div key={bundle.id} className="mb-4 p-3 border rounded bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                {editingBundleId === bundle.id ? (
                  <input
                    type="text"
                    value={editingBundleName}
                    onChange={(e) => setEditingBundleName(e.target.value)}
                    className="border p-1 rounded flex-1 mr-2"
                  />
                ) : (
                  <span className="font-semibold text-lg">{bundle.name}</span>
                )}
                <div className="flex gap-2">
                  {editingBundleId === bundle.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateBundle(bundle.id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                        disabled={!editingBundleName.trim()}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingBundleId(null)}
                        className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingBundleId(bundle.id);
                          setEditingBundleName(bundle.name);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBundle(bundle.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Assign categories to this bundle */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <h4 className="font-medium text-slate-700 mb-2">Categories in this Bundle:</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {bundle.categories.length > 0 ? (
                    bundle.categories.map((bc) => (
                      <span key={bc.category.id} className="flex items-center bg-nreuv-accent/10 text-nreuv-primary text-xs px-2 py-1 rounded-full">
                        {bc.category.name}
                        <button
                          onClick={() => handleUnassignCategory(bundle.id, bc.category.id)}
                          className="ml-1 text-nreuv-primary/70 hover:text-nreuv-primary"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 italic">No categories assigned.</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <select
                    className="border p-2 rounded flex-1"
                    onChange={(e) => handleAssignCategory(bundle.id, e.target.value)}
                    value="" // Controlled component, reset after selection
                  >
                    <option value="">Add Category...</option>
                    {categories.filter(
                      (cat) => !bundle.categories.some((bc) => bc.category.id === cat.id)
                    ).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
          {categoryBundles.length === 0 && (
            <p className="text-sm text-slate-500 italic">No category bundles defined yet.</p>
          )}
        </div>

        <h3 className="text-lg font-medium text-black mb-2 border-t border-slate-200 pt-4">Add New Category Bundle</h3>
        <div className="flex gap-2">
          <input
            type="text"
            className="border p-2 rounded flex-1"
            placeholder="New Bundle Name"
            value={newBundleName}
            onChange={(e) => setNewBundleName(e.target.value)}
          />
          <button
            onClick={handleAddBundle}
            className="bg-nreuv-primary hover:opacity-90 text-white font-bold py-2 px-4 rounded"
            disabled={!newBundleName.trim()}
          >
            Add Bundle
          </button>
        </div>
      </div>
    </div> // Missing closing div for the main wrapper
  );
}
