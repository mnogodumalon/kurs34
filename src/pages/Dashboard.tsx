import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LivingAppsService,
  extractRecordId,
  createRecordUrl,
} from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import type {
  Dozenten,
  Teilnehmer,
  Raeume,
  Kurse,
  Anmeldungen,
} from '@/types/app';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  BookOpen,
  Users,
  GraduationCap,
  DoorOpen,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';

// Types for forms
interface DozentForm {
  name: string;
  email: string;
  telefon: string;
  fachgebiet: string;
}

interface TeilnehmerForm {
  name: string;
  email: string;
  telefon: string;
  geburtsdatum: string;
}

interface RaumForm {
  raumname: string;
  gebaeude: string;
  kapazitaet: string;
}

interface KursForm {
  titel: string;
  beschreibung: string;
  startdatum: string;
  enddatum: string;
  max_teilnehmer: string;
  preis: string;
  dozent: string;
  raum: string;
}

interface AnmeldungForm {
  teilnehmer: string;
  kurs: string;
  anmeldedatum: string;
  bezahlt: boolean;
}

// Stats Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  isHero = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  isHero?: boolean;
}) {
  return (
    <div className={isHero ? 'stat-card-hero' : 'stat-card'}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${isHero ? 'opacity-80' : 'text-muted-foreground'}`}>
            {label}
          </p>
          <p className={`text-3xl font-bold mt-1 ${isHero ? '' : 'text-foreground'}`}>
            {value}
          </p>
          {subtext && (
            <p className={`text-xs mt-1 ${isHero ? 'opacity-70' : 'text-muted-foreground'}`}>
              {subtext}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${isHero ? 'bg-primary-foreground/10' : 'bg-primary/10'}`}>
          <Icon className={`size-5 ${isHero ? '' : 'text-primary'}`} />
        </div>
      </div>
    </div>
  );
}

// Enrollment Badge Component
function EnrollmentBadge({ current, max }: { current: number; max: number }) {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const isFull = percentage >= 80;

  return (
    <div className="flex items-center gap-2">
      <span className={`enrollment-badge ${isFull ? 'enrollment-badge-full' : 'enrollment-badge-normal'}`}>
        {current}/{max}
      </span>
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${isFull ? 'bg-accent' : 'bg-primary'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  // Data state
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kurse');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [dialogType, setDialogType] = useState<'dozent' | 'teilnehmer' | 'raum' | 'kurs' | 'anmeldung'>('kurs');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  // Form state
  const [dozentForm, setDozentForm] = useState<DozentForm>({ name: '', email: '', telefon: '', fachgebiet: '' });
  const [teilnehmerForm, setTeilnehmerForm] = useState<TeilnehmerForm>({ name: '', email: '', telefon: '', geburtsdatum: '' });
  const [raumForm, setRaumForm] = useState<RaumForm>({ raumname: '', gebaeude: '', kapazitaet: '' });
  const [kursForm, setKursForm] = useState<KursForm>({ titel: '', beschreibung: '', startdatum: '', enddatum: '', max_teilnehmer: '', preis: '', dozent: '', raum: '' });
  const [anmeldungForm, setAnmeldungForm] = useState<AnmeldungForm>({ teilnehmer: '', kurs: '', anmeldedatum: '', bezahlt: false });

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [doz, teil, raeu, kurs, anmeld] = await Promise.all([
        LivingAppsService.getDozenten(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getKurse(),
        LivingAppsService.getAnmeldungen(),
      ]);
      setDozenten(doz);
      setTeilnehmer(teil);
      setRaeume(raeu);
      setKurse(kurs);
      setAnmeldungen(anmeld);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const enrollmentsByKurs = anmeldungen.reduce((acc, a) => {
      const kursId = extractRecordId(a.fields.kurs);
      if (kursId) {
        acc[kursId] = (acc[kursId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalCapacity = kurse.reduce((sum, k) => sum + (k.fields.max_teilnehmer || 0), 0);
    const totalEnrollments = anmeldungen.length;
    const avgUtilization = totalCapacity > 0 ? Math.round((totalEnrollments / totalCapacity) * 100) : 0;

    return {
      kurseCount: kurse.length,
      teilnehmerCount: teilnehmer.length,
      dozentenCount: dozenten.length,
      raeumeCount: raeume.length,
      avgUtilization,
      enrollmentsByKurs,
    };
  }, [kurse, teilnehmer, dozenten, raeume, anmeldungen]);

  // Helper functions
  const getDozentName = (url: string | undefined) => {
    if (!url) return '-';
    const id = extractRecordId(url);
    const dozent = dozenten.find((d) => d.record_id === id);
    return dozent?.fields.name || '-';
  };

  const getRaumName = (url: string | undefined) => {
    if (!url) return '-';
    const id = extractRecordId(url);
    const raum = raeume.find((r) => r.record_id === id);
    return raum ? `${raum.fields.raumname} (${raum.fields.gebaeude || '-'})` : '-';
  };

  const getTeilnehmerName = (url: string | undefined) => {
    if (!url) return '-';
    const id = extractRecordId(url);
    const t = teilnehmer.find((p) => p.record_id === id);
    return t?.fields.name || '-';
  };

  const getKursTitel = (url: string | undefined) => {
    if (!url) return '-';
    const id = extractRecordId(url);
    const k = kurse.find((c) => c.record_id === id);
    return k?.fields.titel || '-';
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de });
    } catch {
      return dateStr;
    }
  };

  // Dialog handlers
  const openCreateDialog = (type: typeof dialogType) => {
    setDialogType(type);
    setDialogMode('create');
    setEditingId(null);
    resetForms();
    setDialogOpen(true);
  };

  const openEditDialog = (type: typeof dialogType, id: string) => {
    setDialogType(type);
    setDialogMode('edit');
    setEditingId(id);

    // Pre-fill form
    if (type === 'dozent') {
      const item = dozenten.find((d) => d.record_id === id);
      if (item) {
        setDozentForm({
          name: item.fields.name || '',
          email: item.fields.email || '',
          telefon: item.fields.telefon || '',
          fachgebiet: item.fields.fachgebiet || '',
        });
      }
    } else if (type === 'teilnehmer') {
      const item = teilnehmer.find((t) => t.record_id === id);
      if (item) {
        setTeilnehmerForm({
          name: item.fields.name || '',
          email: item.fields.email || '',
          telefon: item.fields.telefon || '',
          geburtsdatum: item.fields.geburtsdatum || '',
        });
      }
    } else if (type === 'raum') {
      const item = raeume.find((r) => r.record_id === id);
      if (item) {
        setRaumForm({
          raumname: item.fields.raumname || '',
          gebaeude: item.fields.gebaeude || '',
          kapazitaet: item.fields.kapazitaet?.toString() || '',
        });
      }
    } else if (type === 'kurs') {
      const item = kurse.find((k) => k.record_id === id);
      if (item) {
        setKursForm({
          titel: item.fields.titel || '',
          beschreibung: item.fields.beschreibung || '',
          startdatum: item.fields.startdatum || '',
          enddatum: item.fields.enddatum || '',
          max_teilnehmer: item.fields.max_teilnehmer?.toString() || '',
          preis: item.fields.preis?.toString() || '',
          dozent: extractRecordId(item.fields.dozent) || '',
          raum: extractRecordId(item.fields.raum) || '',
        });
      }
    } else if (type === 'anmeldung') {
      const item = anmeldungen.find((a) => a.record_id === id);
      if (item) {
        setAnmeldungForm({
          teilnehmer: extractRecordId(item.fields.teilnehmer) || '',
          kurs: extractRecordId(item.fields.kurs) || '',
          anmeldedatum: item.fields.anmeldedatum || '',
          bezahlt: item.fields.bezahlt || false,
        });
      }
    }

    setDialogOpen(true);
  };

  const resetForms = () => {
    setDozentForm({ name: '', email: '', telefon: '', fachgebiet: '' });
    setTeilnehmerForm({ name: '', email: '', telefon: '', geburtsdatum: '' });
    setRaumForm({ raumname: '', gebaeude: '', kapazitaet: '' });
    setKursForm({ titel: '', beschreibung: '', startdatum: '', enddatum: '', max_teilnehmer: '', preis: '', dozent: '', raum: '' });
    setAnmeldungForm({ teilnehmer: '', kurs: '', anmeldedatum: '', bezahlt: false });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dialogType === 'dozent') {
        const data = { ...dozentForm };
        if (dialogMode === 'create') {
          await LivingAppsService.createDozentenEntry(data);
        } else if (editingId) {
          await LivingAppsService.updateDozentenEntry(editingId, data);
        }
        setDozenten(await LivingAppsService.getDozenten());
      } else if (dialogType === 'teilnehmer') {
        const data = { ...teilnehmerForm };
        if (dialogMode === 'create') {
          await LivingAppsService.createTeilnehmerEntry(data);
        } else if (editingId) {
          await LivingAppsService.updateTeilnehmerEntry(editingId, data);
        }
        setTeilnehmer(await LivingAppsService.getTeilnehmer());
      } else if (dialogType === 'raum') {
        const data = {
          raumname: raumForm.raumname,
          gebaeude: raumForm.gebaeude,
          kapazitaet: parseInt(raumForm.kapazitaet) || 0,
        };
        if (dialogMode === 'create') {
          await LivingAppsService.createRaeumeEntry(data);
        } else if (editingId) {
          await LivingAppsService.updateRaeumeEntry(editingId, data);
        }
        setRaeume(await LivingAppsService.getRaeume());
      } else if (dialogType === 'kurs') {
        const data = {
          titel: kursForm.titel,
          beschreibung: kursForm.beschreibung,
          startdatum: kursForm.startdatum,
          enddatum: kursForm.enddatum,
          max_teilnehmer: parseInt(kursForm.max_teilnehmer) || 0,
          preis: parseFloat(kursForm.preis) || 0,
          dozent: kursForm.dozent ? createRecordUrl(APP_IDS.DOZENTEN, kursForm.dozent) : undefined,
          raum: kursForm.raum ? createRecordUrl(APP_IDS.RAEUME, kursForm.raum) : undefined,
        };
        if (dialogMode === 'create') {
          await LivingAppsService.createKurseEntry(data);
        } else if (editingId) {
          await LivingAppsService.updateKurseEntry(editingId, data);
        }
        setKurse(await LivingAppsService.getKurse());
      } else if (dialogType === 'anmeldung') {
        const data = {
          teilnehmer: anmeldungForm.teilnehmer ? createRecordUrl(APP_IDS.TEILNEHMER, anmeldungForm.teilnehmer) : undefined,
          kurs: anmeldungForm.kurs ? createRecordUrl(APP_IDS.KURSE, anmeldungForm.kurs) : undefined,
          anmeldedatum: anmeldungForm.anmeldedatum,
          bezahlt: anmeldungForm.bezahlt,
        };
        if (dialogMode === 'create') {
          await LivingAppsService.createAnmeldungenEntry(data);
        } else if (editingId) {
          await LivingAppsService.updateAnmeldungenEntry(editingId, data);
        }
        setAnmeldungen(await LivingAppsService.getAnmeldungen());
      }
      setDialogOpen(false);
      resetForms();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (type: string, id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'dozent') {
        await LivingAppsService.deleteDozentenEntry(deleteTarget.id);
        setDozenten(await LivingAppsService.getDozenten());
      } else if (deleteTarget.type === 'teilnehmer') {
        await LivingAppsService.deleteTeilnehmerEntry(deleteTarget.id);
        setTeilnehmer(await LivingAppsService.getTeilnehmer());
      } else if (deleteTarget.type === 'raum') {
        await LivingAppsService.deleteRaeumeEntry(deleteTarget.id);
        setRaeume(await LivingAppsService.getRaeume());
      } else if (deleteTarget.type === 'kurs') {
        await LivingAppsService.deleteKurseEntry(deleteTarget.id);
        setKurse(await LivingAppsService.getKurse());
      } else if (deleteTarget.type === 'anmeldung') {
        await LivingAppsService.deleteAnmeldungenEntry(deleteTarget.id);
        setAnmeldungen(await LivingAppsService.getAnmeldungen());
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  // Get dialog title
  const getDialogTitle = () => {
    const action = dialogMode === 'create' ? 'Neue/r' : 'Bearbeiten:';
    const labels: Record<typeof dialogType, string> = {
      dozent: 'Dozent',
      teilnehmer: 'Teilnehmer',
      raum: 'Raum',
      kurs: 'Kurs',
      anmeldung: 'Anmeldung',
    };
    return `${action} ${labels[dialogType]}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Kursverwaltung</h1>
          <p className="page-subtitle">Verwalten Sie Kurse, Dozenten, Teilnehmer und Anmeldungen</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={BookOpen}
            label="Aktive Kurse"
            value={stats.kurseCount}
            subtext="im System"
            isHero
          />
          <StatCard icon={Users} label="Teilnehmer" value={stats.teilnehmerCount} />
          <StatCard icon={GraduationCap} label="Dozenten" value={stats.dozentenCount} />
          <StatCard icon={DoorOpen} label="Räume" value={stats.raeumeCount} />
          <StatCard
            icon={ClipboardList}
            label="Auslastung"
            value={`${stats.avgUtilization}%`}
            subtext="durchschnittlich"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="kurse">Kurse</TabsTrigger>
              <TabsTrigger value="dozenten">Dozenten</TabsTrigger>
              <TabsTrigger value="teilnehmer">Teilnehmer</TabsTrigger>
              <TabsTrigger value="raeume">Räume</TabsTrigger>
              <TabsTrigger value="anmeldungen">Anmeldungen</TabsTrigger>
            </TabsList>
            <Button
              variant="accent"
              onClick={() => {
                const typeMap: Record<string, typeof dialogType> = {
                  kurse: 'kurs',
                  dozenten: 'dozent',
                  teilnehmer: 'teilnehmer',
                  raeume: 'raum',
                  anmeldungen: 'anmeldung',
                };
                openCreateDialog(typeMap[activeTab]);
              }}
            >
              <Plus className="size-4" />
              Neu erstellen
            </Button>
          </div>

          {/* Kurse Tab */}
          <TabsContent value="kurse">
            <div className="bg-card rounded-lg shadow-[var(--shadow-card)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Dozent</TableHead>
                    <TableHead>Raum</TableHead>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead>Teilnehmer</TableHead>
                    <TableHead>Preis</TableHead>
                    <TableHead className="w-24">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kurse.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Noch keine Kurse vorhanden
                      </TableCell>
                    </TableRow>
                  ) : (
                    kurse.map((kurs) => {
                      const enrolled = stats.enrollmentsByKurs[kurs.record_id] || 0;
                      const max = kurs.fields.max_teilnehmer || 0;
                      return (
                        <TableRow key={kurs.record_id}>
                          <TableCell className="font-medium">{kurs.fields.titel}</TableCell>
                          <TableCell>{getDozentName(kurs.fields.dozent)}</TableCell>
                          <TableCell>{getRaumName(kurs.fields.raum)}</TableCell>
                          <TableCell>
                            {formatDate(kurs.fields.startdatum)} - {formatDate(kurs.fields.enddatum)}
                          </TableCell>
                          <TableCell>
                            <EnrollmentBadge current={enrolled} max={max} />
                          </TableCell>
                          <TableCell>{kurs.fields.preis?.toFixed(2)} €</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEditDialog('kurs', kurs.record_id)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => confirmDelete('kurs', kurs.record_id, kurs.fields.titel || '')}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Dozenten Tab */}
          <TabsContent value="dozenten">
            <div className="bg-card rounded-lg shadow-[var(--shadow-card)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Fachgebiet</TableHead>
                    <TableHead className="w-24">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dozenten.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Noch keine Dozenten vorhanden
                      </TableCell>
                    </TableRow>
                  ) : (
                    dozenten.map((dozent) => (
                      <TableRow key={dozent.record_id}>
                        <TableCell className="font-medium">{dozent.fields.name}</TableCell>
                        <TableCell>{dozent.fields.email}</TableCell>
                        <TableCell>{dozent.fields.telefon || '-'}</TableCell>
                        <TableCell>
                          {dozent.fields.fachgebiet && (
                            <Badge variant="secondary">{dozent.fields.fachgebiet}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditDialog('dozent', dozent.record_id)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => confirmDelete('dozent', dozent.record_id, dozent.fields.name || '')}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Teilnehmer Tab */}
          <TabsContent value="teilnehmer">
            <div className="bg-card rounded-lg shadow-[var(--shadow-card)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Geburtsdatum</TableHead>
                    <TableHead className="w-24">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teilnehmer.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Noch keine Teilnehmer vorhanden
                      </TableCell>
                    </TableRow>
                  ) : (
                    teilnehmer.map((t) => (
                      <TableRow key={t.record_id}>
                        <TableCell className="font-medium">{t.fields.name}</TableCell>
                        <TableCell>{t.fields.email}</TableCell>
                        <TableCell>{t.fields.telefon || '-'}</TableCell>
                        <TableCell>{formatDate(t.fields.geburtsdatum)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditDialog('teilnehmer', t.record_id)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => confirmDelete('teilnehmer', t.record_id, t.fields.name || '')}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Räume Tab */}
          <TabsContent value="raeume">
            <div className="bg-card rounded-lg shadow-[var(--shadow-card)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raumname</TableHead>
                    <TableHead>Gebäude</TableHead>
                    <TableHead>Kapazität</TableHead>
                    <TableHead className="w-24">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {raeume.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Noch keine Räume vorhanden
                      </TableCell>
                    </TableRow>
                  ) : (
                    raeume.map((raum) => (
                      <TableRow key={raum.record_id}>
                        <TableCell className="font-medium">{raum.fields.raumname}</TableCell>
                        <TableCell>{raum.fields.gebaeude || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="muted">{raum.fields.kapazitaet} Plätze</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditDialog('raum', raum.record_id)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => confirmDelete('raum', raum.record_id, raum.fields.raumname || '')}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Anmeldungen Tab */}
          <TabsContent value="anmeldungen">
            <div className="bg-card rounded-lg shadow-[var(--shadow-card)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teilnehmer</TableHead>
                    <TableHead>Kurs</TableHead>
                    <TableHead>Anmeldedatum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anmeldungen.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Noch keine Anmeldungen vorhanden
                      </TableCell>
                    </TableRow>
                  ) : (
                    anmeldungen.map((a) => (
                      <TableRow key={a.record_id}>
                        <TableCell className="font-medium">{getTeilnehmerName(a.fields.teilnehmer)}</TableCell>
                        <TableCell>{getKursTitel(a.fields.kurs)}</TableCell>
                        <TableCell>{formatDate(a.fields.anmeldedatum)}</TableCell>
                        <TableCell>
                          <Badge variant={a.fields.bezahlt ? 'success' : 'destructive'}>
                            {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditDialog('anmeldung', a.record_id)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                confirmDelete(
                                  'anmeldung',
                                  a.record_id,
                                  `${getTeilnehmerName(a.fields.teilnehmer)} - ${getKursTitel(a.fields.kurs)}`
                                )
                              }
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Dozent Form */}
            {dialogType === 'dozent' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={dozentForm.name}
                    onChange={(e) => setDozentForm({ ...dozentForm, name: e.target.value })}
                    placeholder="Max Mustermann"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={dozentForm.email}
                    onChange={(e) => setDozentForm({ ...dozentForm, email: e.target.value })}
                    placeholder="max@beispiel.de"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefon">Telefon</Label>
                  <Input
                    id="telefon"
                    value={dozentForm.telefon}
                    onChange={(e) => setDozentForm({ ...dozentForm, telefon: e.target.value })}
                    placeholder="+49 123 456789"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fachgebiet">Fachgebiet</Label>
                  <Input
                    id="fachgebiet"
                    value={dozentForm.fachgebiet}
                    onChange={(e) => setDozentForm({ ...dozentForm, fachgebiet: e.target.value })}
                    placeholder="Informatik, BWL, ..."
                  />
                </div>
              </>
            )}

            {/* Teilnehmer Form */}
            {dialogType === 'teilnehmer' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={teilnehmerForm.name}
                    onChange={(e) => setTeilnehmerForm({ ...teilnehmerForm, name: e.target.value })}
                    placeholder="Max Mustermann"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={teilnehmerForm.email}
                    onChange={(e) => setTeilnehmerForm({ ...teilnehmerForm, email: e.target.value })}
                    placeholder="max@beispiel.de"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefon">Telefon</Label>
                  <Input
                    id="telefon"
                    value={teilnehmerForm.telefon}
                    onChange={(e) => setTeilnehmerForm({ ...teilnehmerForm, telefon: e.target.value })}
                    placeholder="+49 123 456789"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
                  <Input
                    id="geburtsdatum"
                    type="date"
                    value={teilnehmerForm.geburtsdatum}
                    onChange={(e) => setTeilnehmerForm({ ...teilnehmerForm, geburtsdatum: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Raum Form */}
            {dialogType === 'raum' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="raumname">Raumname *</Label>
                  <Input
                    id="raumname"
                    value={raumForm.raumname}
                    onChange={(e) => setRaumForm({ ...raumForm, raumname: e.target.value })}
                    placeholder="Raum 101"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gebaeude">Gebäude</Label>
                  <Input
                    id="gebaeude"
                    value={raumForm.gebaeude}
                    onChange={(e) => setRaumForm({ ...raumForm, gebaeude: e.target.value })}
                    placeholder="Hauptgebäude"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="kapazitaet">Kapazität *</Label>
                  <Input
                    id="kapazitaet"
                    type="number"
                    min="1"
                    value={raumForm.kapazitaet}
                    onChange={(e) => setRaumForm({ ...raumForm, kapazitaet: e.target.value })}
                    placeholder="20"
                  />
                </div>
              </>
            )}

            {/* Kurs Form */}
            {dialogType === 'kurs' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="titel">Titel *</Label>
                  <Input
                    id="titel"
                    value={kursForm.titel}
                    onChange={(e) => setKursForm({ ...kursForm, titel: e.target.value })}
                    placeholder="Einführung in Python"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="beschreibung">Beschreibung</Label>
                  <Textarea
                    id="beschreibung"
                    value={kursForm.beschreibung}
                    onChange={(e) => setKursForm({ ...kursForm, beschreibung: e.target.value })}
                    placeholder="Kursbeschreibung..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startdatum">Startdatum *</Label>
                    <Input
                      id="startdatum"
                      type="date"
                      value={kursForm.startdatum}
                      onChange={(e) => setKursForm({ ...kursForm, startdatum: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="enddatum">Enddatum *</Label>
                    <Input
                      id="enddatum"
                      type="date"
                      value={kursForm.enddatum}
                      onChange={(e) => setKursForm({ ...kursForm, enddatum: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="max_teilnehmer">Max. Teilnehmer *</Label>
                    <Input
                      id="max_teilnehmer"
                      type="number"
                      min="1"
                      value={kursForm.max_teilnehmer}
                      onChange={(e) => setKursForm({ ...kursForm, max_teilnehmer: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="preis">Preis (€) *</Label>
                    <Input
                      id="preis"
                      type="number"
                      min="0"
                      step="0.01"
                      value={kursForm.preis}
                      onChange={(e) => setKursForm({ ...kursForm, preis: e.target.value })}
                      placeholder="199.00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Dozent *</Label>
                  <Select
                    value={kursForm.dozent}
                    onValueChange={(value) => setKursForm({ ...kursForm, dozent: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dozent auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {dozenten.map((d) => (
                        <SelectItem key={d.record_id} value={d.record_id}>
                          {d.fields.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Raum *</Label>
                  <Select
                    value={kursForm.raum}
                    onValueChange={(value) => setKursForm({ ...kursForm, raum: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Raum auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {raeume.map((r) => (
                        <SelectItem key={r.record_id} value={r.record_id}>
                          {r.fields.raumname} ({r.fields.gebaeude || '-'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Anmeldung Form */}
            {dialogType === 'anmeldung' && (
              <>
                <div className="grid gap-2">
                  <Label>Teilnehmer *</Label>
                  <Select
                    value={anmeldungForm.teilnehmer}
                    onValueChange={(value) => setAnmeldungForm({ ...anmeldungForm, teilnehmer: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Teilnehmer auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {teilnehmer.map((t) => (
                        <SelectItem key={t.record_id} value={t.record_id}>
                          {t.fields.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Kurs *</Label>
                  <Select
                    value={anmeldungForm.kurs}
                    onValueChange={(value) => setAnmeldungForm({ ...anmeldungForm, kurs: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kurs auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {kurse.map((k) => (
                        <SelectItem key={k.record_id} value={k.record_id}>
                          {k.fields.titel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="anmeldedatum">Anmeldedatum *</Label>
                  <Input
                    id="anmeldedatum"
                    type="date"
                    value={anmeldungForm.anmeldedatum}
                    onChange={(e) => setAnmeldungForm({ ...anmeldungForm, anmeldedatum: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bezahlt"
                    checked={anmeldungForm.bezahlt}
                    onCheckedChange={(checked) =>
                      setAnmeldungForm({ ...anmeldungForm, bezahlt: checked === true })
                    }
                  />
                  <Label htmlFor="bezahlt" className="cursor-pointer">
                    Bezahlt
                  </Label>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {dialogMode === 'create' ? 'Erstellen' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Löschen bestätigen</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Möchten Sie <span className="font-semibold text-foreground">{deleteTarget?.name}</span> wirklich
            löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
