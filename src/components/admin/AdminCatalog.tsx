import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';

const AdminCatalog: React.FC = () => {
  const { companyId, isCompanyAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [therapeuticArea, setTherapeuticArea] = useState<string>('all');
  const [region, setRegion] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState('launched');
  const [newTA, setNewTA] = useState('Oncology');
  const [newRegion, setNewRegion] = useState('EU');
  const [newLaunch, setNewLaunch] = useState<Date | undefined>(undefined);
  const [newTags, setNewTags] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const canSave = useMemo(() => newName.trim().length > 1, [newName]);

  const addBrand = async () => {
    if (!isCompanyAdmin || !companyId || !canSave) return;
    setAdding(true);
    await supabase.from('brands').insert({
      company_id: companyId,
      name: newName.trim(),
      status: newStatus,
      therapeutic_area: newTA,
      region: newRegion,
      launch_date: newLaunch ? new Date(newLaunch).toISOString() : null,
      tags: newTags ? newTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      notes: newNotes || null,
    });
    setAdding(false);
    setOpen(false);
    setNewName(''); setNewStatus('launched'); setNewTA('Oncology'); setNewRegion('EU'); setNewLaunch(undefined); setNewTags(''); setNewNotes('');
    // Optionally: reload list here once list is implemented
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Brands</h1>
          <p className="text-gray-600 dark:text-white/70">Manage your brands and their metadata.</p>
        </div>
      </div>

      {/* Search + Add + Filters row */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Input
            className="flex-1 bg-white/80 dark:bg-white/5 border border-gray-300 dark:border-white/10"
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isCompanyAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="glassAccent">+ Add Brand</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add new brand</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-white/70">Name</label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Brand A" />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">planned</SelectItem>
                        <SelectItem value="launched">launched</SelectItem>
                        <SelectItem value="sunset">sunset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Therapeutic Area</label>
                    <Select value={newTA} onValueChange={setNewTA}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Oncology">Oncology</SelectItem>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Neurology">Neurology</SelectItem>
                        <SelectItem value="Immunology">Immunology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Region</label>
                    <Select value={newRegion} onValueChange={setNewRegion}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EU">EU</SelectItem>
                        <SelectItem value="US">US</SelectItem>
                        <SelectItem value="APAC">APAC</SelectItem>
                        <SelectItem value="LATAM">LATAM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Launch date</label>
                    <div className="rounded-md border border-white/10 p-2">
                      <Calendar selected={newLaunch} onSelect={setNewLaunch} mode="single" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-white/70">Tags (comma-separated)</label>
                    <Input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="e.g., hospital, tender" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-white/70">Notes</label>
                    <Input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Optional notes" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="glass" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button variant="glassAccent" onClick={addBrand} disabled={!canSave || adding}>{adding ? 'Saving...' : 'Save'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="planned">planned</SelectItem>
              <SelectItem value="launched">launched</SelectItem>
              <SelectItem value="sunset">sunset</SelectItem>
            </SelectContent>
          </Select>
          <Select value={therapeuticArea} onValueChange={setTherapeuticArea}>
            <SelectTrigger className="w-48 bg-white/5 border-white/10">
              <SelectValue placeholder="Therapeutic area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              <SelectItem value="Oncology">Oncology</SelectItem>
              <SelectItem value="Cardiology">Cardiology</SelectItem>
              <SelectItem value="Neurology">Neurology</SelectItem>
              <SelectItem value="Immunology">Immunology</SelectItem>
            </SelectContent>
          </Select>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              <SelectItem value="EU">EU</SelectItem>
              <SelectItem value="US">US</SelectItem>
              <SelectItem value="APAC">APAC</SelectItem>
              <SelectItem value="LATAM">LATAM</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div className="text-xs text-white/70">From</div>
            <Input
              type="text"
              inputMode="numeric"
              aria-label="From date (YYYY-MM-DD)"
              placeholder="YYYY-MM-DD"
              className="bg-white/5 border-white/10"
              value={dateFrom ? new Date(dateFrom).toISOString().slice(0,10) : ''}
              onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : undefined)}
            />
            <div className="text-xs text-white/70">To</div>
            <Input
              type="text"
              inputMode="numeric"
              aria-label="To date (YYYY-MM-DD)"
              placeholder="YYYY-MM-DD"
              className="bg-white/5 border-white/10"
              value={dateTo ? new Date(dateTo).toISOString().slice(0,10) : ''}
              onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
        </div>
      </div>

              {/* Here later you can display list of brands with applied filters */}
    </div>
  );
};

export default AdminCatalog;

