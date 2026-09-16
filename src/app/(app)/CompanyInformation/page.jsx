"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getCompanyInfo, saveCompanyInfo } from "@/lib/api-client/company-info";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Phone, Mail, MapPin, Edit, Save, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CompanyInformation() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [companyInfo, setCompanyInfo] = useState(null);

  const effectiveUser = useCurrentUser();

  const defaults = {
    company_name: 'TherapyDocs',
    logo_url: '',
    tagline: 'Contract Therapy Services',
    description: 'Contract Therapy Services providing comprehensive therapy documentation solutions for healthcare professionals. We specialize in Physical Therapy, Occupational Therapy, and Speech Therapy services.',
    phone: '(555) 123-4567',
    email: 'info@therapydocs.com',
    address_line1: '123 Healthcare Drive',
    address_line2: 'Medical Plaza, Suite 200',
    address_line3: 'City, State 12345',
    monday_friday_hours: '8:00 AM - 6:00 PM',
    weekend_hours: 'Closed',
  };

  const loadInfo = useCallback(async () => {
    try {
      const data = await getCompanyInfo();
      if (data) setCompanyInfo(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadInfo(); }, [loadInfo]);

  const info = companyInfo || defaults;

  const canEdit = effectiveUser?.role === 'superuser' || effectiveUser?.user_type === 'superuser';

  const handleEdit = () => {
    setFormData(companyInfo || defaults);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const result = await saveCompanyInfo(formData);
      if (result?.success) {
        toast.success("Company info saved");
        setIsEditing(false);
        loadInfo();
      }
    } catch (err) {
      toast.error("Failed to save company info");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setFormData({ ...formData, logo_url: url });
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error('Failed to upload logo');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Company Information</h1>
          <p className="text-slate-500">Details about {info.company_name} and our services</p>
        </div>
        {canEdit && !isEditing && (
          <Button onClick={handleEdit} className="bg-teal-600 hover:bg-teal-700">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
        {canEdit && isEditing && (
          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleCancel} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Company Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              Company Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company Logo</label>
                  {formData.logo_url && (
                    <div className="mb-3">
                      <img src={formData.logo_url} alt="Logo" className="h-20 object-contain" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="max-w-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                  <Input
                    value={formData.company_name || ''}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                  <Input
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>
              </>
            ) : (
              <div>
                {info.logo_url && (
                  <div className="mb-4">
                    <img src={info.logo_url} alt={`${info.company_name} logo`} className="h-24 object-contain" />
                  </div>
                )}
                <h3 className="font-semibold text-slate-900 mb-2">{info.company_name}</h3>
                <p className="text-sm text-slate-500 mb-2">{info.tagline}</p>
                <p className="text-slate-600">{info.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-teal-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1</label>
                  <Input
                    value={formData.address_line1 || ''}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2</label>
                  <Input
                    value={formData.address_line2 || ''}
                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 3</label>
                  <Input
                    value={formData.address_line3 || ''}
                    onChange={(e) => setFormData({ ...formData, address_line3: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="font-medium text-slate-900">Phone</p>
                    <p className="text-slate-600">{info.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="font-medium text-slate-900">Email</p>
                    <p className="text-slate-600">{info.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="font-medium text-slate-900">Address</p>
                    <p className="text-slate-600">
                      {info.address_line1}<br />
                      {info.address_line2}<br />
                      {info.address_line3}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Our Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-teal-50 rounded-lg">
                <h4 className="font-semibold text-teal-900 mb-2">Physical Therapy</h4>
                <p className="text-sm text-teal-700">
                  Comprehensive PT evaluations and treatment documentation
                </p>
              </div>

              <div className="p-4 bg-teal-50 rounded-lg">
                <h4 className="font-semibold text-teal-900 mb-2">Occupational Therapy</h4>
                <p className="text-sm text-teal-700">
                  OT assessments and intervention tracking
                </p>
              </div>

              <div className="p-4 bg-teal-50 rounded-lg">
                <h4 className="font-semibold text-teal-900 mb-2">Speech Therapy</h4>
                <p className="text-sm text-teal-700">
                  Speech and language therapy documentation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monday - Friday</label>
                  <Input
                    value={formData.monday_friday_hours || ''}
                    onChange={(e) => setFormData({ ...formData, monday_friday_hours: e.target.value })}
                    placeholder="8:00 AM - 6:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Saturday - Sunday</label>
                  <Input
                    value={formData.weekend_hours || ''}
                    onChange={(e) => setFormData({ ...formData, weekend_hours: e.target.value })}
                    placeholder="Closed"
                  />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-slate-900">Monday - Friday</p>
                  <p className="text-slate-600">{info.monday_friday_hours}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Saturday - Sunday</p>
                  <p className="text-slate-600">{info.weekend_hours}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
