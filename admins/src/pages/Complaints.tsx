import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Complaint {
  id: string;
  userId: string;
  userEmail: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.listAllComplaints();
      setComplaints(response.complaints);
    } catch (error) {
      console.error('Error loading complaints:', error);
      toast.error('Şikayetler yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    try {
      await adminApi.deleteComplaint(complaintId);
      setComplaints(prev => prev.filter(c => c.id !== complaintId));
      toast.success('Şikayet silindi.');
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast.error('Şikayet silinirken bir hata oluştu.');
    }
  };

  const handleUpdateStatus = async (complaintId: string, status: 'pending' | 'resolved' | 'rejected') => {
    try {
      await adminApi.updateComplaintStatus(complaintId, status);
      setComplaints(prev => prev.map(c => 
        c.id === complaintId ? { ...c, status } : c
      ));
      toast.success(`Şikayet durumu güncellendi: ${status}`);
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('Şikayet güncellenirken bir hata oluştu.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">Beklemede</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-700">Çözüldü</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-700">Reddedildi</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Şikayetler</h1>
        <p className="text-muted-foreground">Kullanıcı şikayetlerini görüntüle ve yönet.</p>
      </div>

      <div className="grid gap-4">
        {complaints.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz şikayet bulunmuyor.</p>
            </CardContent>
          </Card>
        ) : (
          complaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <CardTitle className="text-lg">Şikayet #{complaint.id.slice(0, 8)}</CardTitle>
                  </div>
                  {getStatusBadge(complaint.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {complaint.userEmail} • {formatDate(complaint.createdAt)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{complaint.message}</p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(complaint.id, 'resolved')}
                    className="text-green-600 hover:text-green-700 hover:bg-green-500/10"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Çözüldü
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(complaint.id, 'rejected')}
                    className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reddet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(complaint.id, 'pending')}
                    className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/10"
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Beklemede
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComplaint(complaint.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-500/10 ml-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
