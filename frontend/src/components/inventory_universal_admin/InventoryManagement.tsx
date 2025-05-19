import { useState, useEffect } from 'react';
import { 
  Search, Download, 
  AlertCircle, Calendar, RefreshCw, ChevronDown,
  AlertTriangle, CheckCircle, Clock, RotateCw
} from 'lucide-react';
import { fetchLicenses, renewLicense, License } from '../../services/licenseService';
import ScrollToTopButton from '../SalesReport/ScrollToTopButton'; 

export default function InventoryManagement() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [renewingLicense, setRenewingLicense] = useState<number | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);  // state for success popup
  const [successMessage, setSuccessMessage] = useState('');  // state for success message

  const loadLicenses = async () => {
    try {
      setLoading(true);
      const data = await fetchLicenses();
      setLicenses(data);
      setError('');
    } catch (err) {
      setError('Failed to load licenses');
      console.error('Error loading licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLicenses();
    setIsRefreshing(false);
  };

  const handleRenewal = async (userId: number, duration: string) => {
    try {
      setRenewingLicense(userId);
      await renewLicense(userId, duration);
      await loadLicenses(); // Refresh the list after renewal
      setError('');
      setSuccessMessage(`License for ${userId} renewed successfully!`);  // set success message
      setShowSuccessPopup(true);  // show the success popup
    } catch (err) {
      setError('Failed to renew license');
      console.error('Error renewing license:', err);
    } finally {
      setRenewingLicense(null);
    }
  };

  const getStatusIcon = (status: License['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const filterByExpiry = (license: License) => {
    const today = new Date();
    const expiryDate = new Date(license.end_date);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    switch (expiryFilter) {
      case '30days':
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      case '90days':
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
      case 'expired':
        return daysUntilExpiry <= 0;
      default:
        return true;
    }
  };

  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch =
      license.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.licence_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedFilter === 'all' || license.status === selectedFilter;
    const matchesExpiry = filterByExpiry(license);

    return matchesSearch && matchesStatus && matchesExpiry;
  });

  const getStatusColor = (status: License['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading licenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadLicenses}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {showSuccessPopup && (
          <div className="fixed top-0 left-0 right-0 mt-10 mx-auto max-w-xs bg-green-500 text-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <span>{successMessage}</span>
              <button onClick={closeSuccessPopup} className="text-white">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">License Management</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleRefresh}
                  className={`p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                  <div className="flex-1 min-w-0">
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Search by email or license name..."
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="pending">Pending</option>
                    </select>

                    <select
                      value={expiryFilter}
                      onChange={(e) => setExpiryFilter(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="all">All Expiry</option>
                      <option value="30days">Expires in 30 days</option>
                      <option value="90days">Expires in 90 days</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        License Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLicenses.map((license) => (
                      <tr key={license.user_id}>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{license.licence_name}</span>
                            <span className="text-sm text-gray-500">{license.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(license.status)}`}>
                            {getStatusIcon(license.status)}
                            <span className="ml-1 capitalize">{license.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${getUsageColor(license.usage_percentage)}`}
                                style={{ width: `${license.usage_percentage}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm text-gray-500">{license.usage_percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-500">
                              {new Date(license.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative inline-block text-left">
                            <button
                              className={`inline-flex items-center px-3 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                renewingLicense === license.user_id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={renewingLicense === license.user_id}
                              onClick={() => {
                                const select = document.getElementById(`renewal-${license.user_id}`);
                                if (select) {
                                  select.click();
                                }
                              }}
                            >
                              {renewingLicense === license.user_id ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <RotateCw className="w-4 h-4 mr-2" />
                              )}
                              {renewingLicense === license.user_id ? 'Renewing...' : 'Renew'}
                            </button>
                            <select
                              id={`renewal-${license.user_id}`}
                              className="absolute opacity-0 w-full h-full top-0 left-0 cursor-pointer"
                              onChange={(e) => handleRenewal(license.user_id, e.target.value)}
                              disabled={renewingLicense === license.user_id}
                            >
                              <option value="">Select duration</option>
                              <option value="1month">1 Month</option>
                              <option value="3months">3 Months</option>
                              <option value="6months">6 Months</option>
                              <option value="1year">1 Year</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}