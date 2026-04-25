import { Router, RequestHandler } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret';

// Middleware to check admin key
const checkAdmin: RequestHandler = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (adminKey !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }
  
  next();
};

// Activate premium for user (Havale/EFT sonrası admin tarafından)
const activatePremium: RequestHandler = async (req, res) => {
  try {
    const { userId, months = 1, paymentMethod, paymentReference } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Kullanıcı ID gereklidir' });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        status: 'active',
        expiresAt,
        paymentMethod: paymentMethod || 'havale',
        paymentReference,
        activatedByAdmin: true,
      },
    });

    res.json({
      success: true,
      message: 'Premium aktif edildi',
      subscription: {
        id: subscription.id,
        expiresAt: subscription.expiresAt,
      },
    });
  } catch (error) {
    console.error('Activate premium error:', error);
    res.status(500).json({ error: 'Premium aktifleştirme sırasında hata oluştu' });
  }
};

// Cancel Premium
const cancelPremium: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Kullanıcı ID gereklidir' });
    }

    await prisma.subscription.deleteMany({
      where: { userId, status: 'active' },
    });

    res.json({ success: true, message: 'Premium üyelik iptal edildi' });
  } catch (error) {
    console.error('Cancel premium error:', error);
    res.status(500).json({ error: 'Premium iptal edilirken hata oluştu' });
  }
};

// List all users with their premium status
const listAllUsers: RequestHandler = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          where: {
            status: 'active',
            expiresAt: { gt: new Date() },
          },
          select: {
            id: true,
            expiresAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const usersWithStatus = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      isPremium: user.subscriptions.length > 0,
      premiumExpiry: user.subscriptions[0]?.expiresAt || null,
    }));

    res.json({ users: usersWithStatus });
  } catch (error) {
    console.error('List all users error:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};
const listPendingPayments: RequestHandler = async (req, res) => {
  try {
    // Son 30 gün içinde kayıt olup premium olmayan kullanıcılar
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        subscriptions: { 
          none: { 
            status: 'active',
            expiresAt: { gt: new Date() }
          } 
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error) {
    console.error('List pending error:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

// Get user stats
const getStats: RequestHandler = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const premiumUsers = await prisma.subscription.count({
      where: {
        status: 'active',
        expiresAt: { gt: new Date() },
      },
    });

    res.json({
      totalUsers,
      premiumUsers,
      freeUsers: totalUsers - premiumUsers,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

// Delete user
const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Kullanıcı ID gereklidir' });
    }

    // Delete related records first
    await prisma.usage.deleteMany({ where: { userId } });
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.verificationCode.deleteMany({ where: { userId } });

    // Delete user
    await prisma.user.delete({ where: { id: userId } });

    res.json({ success: true, message: 'Kullanıcı silindi' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Kullanıcı silinirken hata oluştu' });
  }
};

// Submit complaint
const submitComplaint: RequestHandler = async (req, res) => {
  try {
    const { userId, userEmail, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'Kullanıcı ID ve mesaj gereklidir' });
    }

    const complaint = await prisma.complaint.create({
      data: {
        userId,
        userEmail: userEmail || 'Unknown',
        message,
        status: 'pending',
      },
    });

    res.json({
      success: true,
      message: 'Şikayet gönderildi',
      complaint: {
        id: complaint.id,
        createdAt: complaint.createdAt,
      },
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    res.status(500).json({ error: 'Şikayet gönderilirken hata oluştu' });
  }
};

// List all complaints
const listAllComplaints: RequestHandler = async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({ complaints });
  } catch (error) {
    console.error('List complaints error:', error);
    res.status(500).json({ error: 'Şikayetler listelenirken hata oluştu' });
  }
};

// Update complaint status
const updateComplaintStatus: RequestHandler = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status } = req.body;

    if (!complaintId || !status) {
      return res.status(400).json({ error: 'Şikayet ID ve status gereklidir' });
    }

    await prisma.complaint.update({
      where: { id: complaintId },
      data: { status },
    });

    res.json({ success: true, message: 'Şikayet durumu güncellendi' });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ error: 'Şikayet güncellenirken hata oluştu' });
  }
};

// Delete complaint
const deleteComplaint: RequestHandler = async (req, res) => {
  try {
    const { complaintId } = req.params;

    if (!complaintId) {
      return res.status(400).json({ error: 'Şikayet ID gereklidir' });
    }

    await prisma.complaint.delete({ where: { id: complaintId } });

    res.json({ success: true, message: 'Şikayet silindi' });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ error: 'Şikayet silinirken hata oluştu' });
  }
};

router.post('/submit-complaint', submitComplaint);

router.use(checkAdmin);
router.post('/activate-premium', activatePremium);
router.post('/cancel-premium', cancelPremium);
router.get('/pending-payments', listPendingPayments);
router.get('/list-all', listAllUsers);
router.get('/stats', getStats);
router.delete('/user/:userId', deleteUser);

// Complaint routes (admin-only)
router.get('/complaints', listAllComplaints);
router.patch('/complaint/:complaintId/status', updateComplaintStatus);
router.delete('/complaint/:complaintId', deleteComplaint);

export default router;
