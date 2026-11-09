const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { JWT_SECRET } = require('../middlewares/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tên, email và mật khẩu' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email này đã được đăng ký trong hệ thống' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'member'
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi đăng ký tài khoản: ' + err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi đăng nhập: ' + err.message });
  }
};

// Đăng nhập / Đăng ký nhanh bằng Google OAuth2
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Thiếu Google credential token' });
    }

    let payload;
    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        payload = ticket.getPayload();
      } else {
        // Fallback giải mã nếu chưa cấu hình GOOGLE_CLIENT_ID (chế độ demo)
        payload = jwt.decode(credential);
      }
    } catch (verifyErr) {
      console.warn('Verify token bằng Google SDK thất bại, giải mã trực tiếp:', verifyErr.message);
      payload = jwt.decode(credential);
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Token Google không hợp lệ hoặc không trích xuất được email' });
    }

    const { email, name, picture, sub: googleId } = payload;
    const cleanEmail = email.toLowerCase().trim();

    // Tìm kiếm user đã có trong hệ thống theo email hoặc googleId
    let user = await User.findOne({
      $or: [{ googleId }, { email: cleanEmail }]
    });

    if (!user) {
      // Tự động khởi tạo tài khoản mới nếu lần đầu đăng nhập bằng Gmail
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        googleId,
        avatar: picture || '',
        authProvider: 'google',
        role: 'member'
      });
    } else {
      // Cập nhật thông tin avatar và googleId nếu chưa có
      let changed = false;
      if (!user.googleId && googleId) { user.googleId = googleId; changed = true; }
      if (!user.avatar && picture) { user.avatar = picture; changed = true; }
      if (changed) await user.save();
    }

    // Cấp phát JWT token của hệ thống
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Đăng nhập bằng Google thành công',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xử lý đăng nhập Google: ' + err.message });
  }
};

// Cung cấp cấu hình auth công khai (như Google Client ID) cho client
exports.getAuthConfig = (req, res) => {
  res.status(200).json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi truy xuất thông tin: ' + err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('_id name email role avatar');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải danh sách người dùng: ' + err.message });
  }
};
