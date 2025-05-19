import React, { useState, useEffect } from 'react';
import { Search, Store, Key, AlertCircle, Loader2, CheckCircle, X } from 'lucide-react';
import { searchStoreByEmail, saveRazorpayCredentials } from '../../services/service';

interface RazorpayCredentials {
  store_id: number | string;
  key_id: string;
  key_secret: string;
}

export function RazorpayLookup() {
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState<RazorpayCredentials>({
    store_id: '',
    key_id: '',
    key_secret: '',
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCredentialFields, setShowCredentialFields] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleEmailSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSearching(true);

    try {
      const data = await searchStoreByEmail(email);
      setFormData(prev => ({ ...prev, store_id: data.store_id.toString() }));
      setShowCredentialFields(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while searching for the store.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      await saveRazorpayCredentials({
        store_id: parseInt(formData.store_id.toString(), 10),
        key_id: formData.key_id,
        key_secret: formData.key_secret,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save Razorpay credentials.');
    } finally {
      setIsSubmitting(false);
      setIsModalVisible(true);
    }
  };

  const handleReset = () => {
    setShowCredentialFields(false);
    setFormData({ store_id: '', key_id: '', key_secret: '' });
    setEmail('');
    setError(null);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=2070")',
        backgroundBlendMode: 'overlay'
      }}
    >
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-600 rounded-full">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Razorpay Integration</h1>
            <p className="text-sm text-gray-600">Configure your store's payment gateway</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Email Search Form */}
          <form onSubmit={handleEmailSearch} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Search Store by Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 backdrop-blur-sm"
                  placeholder="Enter store email address"
                  required
                  disabled={showCredentialFields}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-5 h-5" />
                </div>
              </div>
            </div>

            {!showCredentialFields && (
              <button
                type="submit"
                disabled={isSearching}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 inline mr-2" />
                    Search Store
                  </>
                )}
              </button>
            )}
          </form>

          {/* Store ID Display */}
          {showCredentialFields && formData.store_id && (
            <div className="p-4 bg-indigo-50/80 backdrop-blur-sm rounded-lg border border-indigo-100">
              <label className="block text-sm font-medium text-indigo-900 mb-1">Store ID</label>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono bg-white/90 p-2 rounded border border-indigo-200 flex-1">
                  {formData.store_id}
                </p>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          {showCredentialFields && (
            <form onSubmit={handleCredentialSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="key_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Key ID
                  </label>
                  <input
                    type="text"
                    id="key_id"
                    value={formData.key_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, key_id: e.target.value }))}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter Razorpay Key ID"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="key_secret" className="block text-sm font-medium text-gray-700 mb-2">
                    Key Secret
                  </label>
                  <input
                    type="text"
                    id="key_secret"
                    value={formData.key_secret}
                    onChange={(e) => setFormData((prev) => ({ ...prev, key_secret: e.target.value }))}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter Razorpay Key Secret"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Key className="w-5 h-5 inline mr-2" />
                      Save Credentials
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Modal */}
          {isModalVisible && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full m-4 transform transition-all animate-modal-slide-in">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Operation Result</h2>
                    <button 
                      onClick={closeModal}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Success Message */}
                  {success && (
                    <div className="p-4 bg-green-50 rounded-lg flex items-start gap-3 animate-fade-in">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-green-800">Success!</h3>
                        <p className="text-sm text-green-700 mt-1">
                          Razorpay credentials have been saved successfully.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && !success && (
                    <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3 animate-fade-in">
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-red-800">Error</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={closeModal}
                    className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}