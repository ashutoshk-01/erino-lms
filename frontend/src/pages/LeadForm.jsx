import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { leadsAPI } from '../services/api';
import { ArrowLeft, Save, User, Mail, Phone, Building, MapPin, Users, Star, DollarSign, Calendar, CheckSquare } from 'lucide-react';

const LeadForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm();

  useEffect(() => {
    if (isEditing) {
      loadLead();
    }
  }, [id, isEditing, loadLead]);

  const loadLead = useCallback(async () => {
    setInitialLoading(true);
    try {
      const response = await leadsAPI.getLead(id);
      const lead = response.data.lead;
      
      // Set form values
      Object.keys(lead).forEach(key => {
        if (key === 'lastActivityAt' && lead[key]) {
          // Format date for input field
          setValue(key, new Date(lead[key]).toISOString().slice(0, 16));
        } else {
          setValue(key, lead[key]);
        }
      });
    } catch (error) {
      console.error('Error loading lead:', error);
      toast.error('Failed to load lead details');
      navigate('/dashboard');
    } finally {
      setInitialLoading(false);
    }
  }, [id, setValue, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Convert lastActivityAt to proper format
      const submitData = { ...data };
      if (submitData.lastActivityAt) {
        submitData.lastActivityAt = new Date(submitData.lastActivityAt).toISOString();
      } else {
        submitData.lastActivityAt = null;
      }

      // Convert numeric fields
      submitData.score = parseInt(submitData.score, 10);
      submitData.leadValue = parseFloat(submitData.leadValue);
      submitData.isQualified = submitData.isQualified === 'true';

      if (isEditing) {
        await leadsAPI.updateLead(id, submitData);
        toast.success('Lead updated successfully');
      } else {
        await leadsAPI.createLead(submitData);
        toast.success('Lead created successfully');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error.response?.data?.message || 
        (isEditing ? 'Failed to update lead' : 'Failed to create lead');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Lead' : 'Create New Lead'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isEditing 
            ? 'Update the lead information below' 
            : 'Fill out the form below to add a new lead to your pipeline'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </h3>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: { value: 2, message: 'First name must be at least 2 characters' }
                  })}
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                  })}
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    type="email"
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="john.doe@example.com"
                  />
                  <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <input
                    {...register('phone', {
                      required: 'Phone number is required'
                    })}
                    type="tel"
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="(555) 123-4567"
                  />
                  <Phone className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Company & Location
            </h3>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <div className="relative">
                  <input
                    {...register('company', {
                      required: 'Company name is required'
                    })}
                    type="text"
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Acme Corporation"
                  />
                  <Building className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.company && (
                  <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <div className="relative">
                  <input
                    {...register('city', {
                      required: 'City is required'
                    })}
                    type="text"
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="New York"
                  />
                  <MapPin className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  {...register('state', {
                    required: 'State is required'
                  })}
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="NY"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lead Details */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Lead Details
            </h3>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Source *
                </label>
                <select
                  {...register('source', {
                    required: 'Source is required'
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select source</option>
                  <option value="website">Website</option>
                  <option value="facebook_ads">Facebook Ads</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="referral">Referral</option>
                  <option value="events">Events</option>
                  <option value="other">Other</option>
                </select>
                {errors.source && (
                  <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  {...register('status', {
                    required: 'Status is required'
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="lost">Lost</option>
                  <option value="won">Won</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Score (0-100) *
                </label>
                <div className="relative">
                  <input
                    {...register('score', {
                      required: 'Score is required',
                      min: { value: 0, message: 'Score must be at least 0' },
                      max: { value: 100, message: 'Score cannot exceed 100' }
                    })}
                    type="number"
                    min="0"
                    max="100"
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="75"
                  />
                  <Star className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.score && (
                  <p className="mt-1 text-sm text-red-600">{errors.score.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="leadValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Value ($) *
                </label>
                <div className="relative">
                  <input
                    {...register('leadValue', {
                      required: 'Lead value is required',
                      min: { value: 0, message: 'Lead value must be positive' }
                    })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="5000.00"
                  />
                  <DollarSign className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.leadValue && (
                  <p className="mt-1 text-sm text-red-600">{errors.leadValue.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastActivityAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Activity
                </label>
                <div className="relative">
                  <input
                    {...register('lastActivityAt')}
                    type="datetime-local"
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <Calendar className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label htmlFor="isQualified" className="block text-sm font-medium text-gray-700 mb-1">
                  Qualified Status *
                </label>
                <div className="relative">
                  <select
                    {...register('isQualified', {
                      required: 'Qualified status is required'
                    })}
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select status</option>
                    <option value="true">Qualified</option>
                    <option value="false">Not Qualified</option>
                  </select>
                  <CheckSquare className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.isQualified && (
                  <p className="mt-1 text-sm text-red-600">{errors.isQualified.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Link
            to="/dashboard"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Update Lead' : 'Create Lead'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeadForm;