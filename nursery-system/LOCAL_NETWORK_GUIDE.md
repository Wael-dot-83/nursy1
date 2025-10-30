# Local Network Deployment Guide

## Overview

This guide explains how to run the Nursery Management System on your local network, making it accessible to all users on the same WiFi/network without internet deployment.

## 🎯 Use Cases

- **Small Nurseries**: Don't need cloud hosting
- **Testing**: Test before cloud deployment
- **Privacy**: Keep data on local network only
- **Offline Operation**: Works without internet
- **Cost Saving**: No hosting fees

## 🚀 Quick Start (5 Minutes)

### Step 1: Configure Firewall (One-time)

**Windows:**
```cmd
Right-click configure-firewall.bat → Run as Administrator
```

**macOS/Linux:**
```bash
# Usually no firewall configuration needed
# If needed, allow ports 8000 and 5173
```

### Step 2: Start the Server

**Windows:**
```cmd
Double-click: start-local-server.bat
```

**macOS/Linux:**
```bash
chmod +x start-local-server.sh
./start-local-server.sh
```

### Step 3: Access from Any Device

The script will show you the access URL, typically:
```
http://192.168.1.11:5173
```

Share this URL with all users on your network!

---

## 📱 User Access Instructions

### For Staff/Users

1. **Connect to WiFi**
   - Connect to the same WiFi network as the server computer
   - WiFi name: [Your WiFi Name]

2. **Open Browser**
   - Chrome, Firefox, Safari, or Edge
   - On phone, tablet, or computer

3. **Visit the URL**
   ```
   http://192.168.1.11:5173
   ```
   (Your actual URL will be shown when you start the server)

4. **Login**
   - Email: Your assigned email
   - Password: Your assigned password

5. **Bookmark**
   - Save the URL as a bookmark/favorite for quick access

### QR Code Access (Optional)

Generate a QR code for your URL at: https://qr-code-generator.com

Users can scan it to access the application instantly!

---

## 🖥️ Server Computer Requirements

### Minimum Specifications

- **OS**: Windows 10+, macOS 10.15+, or Linux
- **CPU**: 2 cores
- **RAM**: 4GB (8GB recommended)
- **Storage**: 10GB free space
- **Network**: WiFi or Ethernet connection

### Recommended Specifications

- **CPU**: 4 cores or more
- **RAM**: 8GB or more
- **Storage**: SSD with 20GB+ free space
- **Network**: Gigabit Ethernet for best performance

### Server Computer Should:

- ✅ Stay powered on during working hours
- ✅ Not go to sleep (disable sleep mode)
- ✅ Have stable power supply
- ✅ Be connected to reliable network
- ✅ Have Windows Firewall configured

---

## 📊 Network Configuration

### Find Your Local IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your network adapter (usually starts with 192.168.x.x)

**macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Linux:**
```bash
hostname -I
```

### Common IP Ranges

- `192.168.0.x` - Common home network
- `192.168.1.x` - Common home/office network
- `10.0.0.x` - Some routers
- `172.16.0.x` - Less common

### Update Configuration

If your IP address changes, update these files:
1. `backend/.env.local` - Update `ALLOWED_ORIGINS`
2. `frontend/.env.local` - Update `VITE_API_URL`
3. Restart the server

---

## 🔧 Configuration

### Backend Configuration (.env.local)

```env
# Database
DATABASE_URL=sqlite:///./nursery.db

# Security
SECRET_KEY=<your-generated-key>

# CORS - Allow local network access
ALLOWED_ORIGINS=http://192.168.1.11:5173,http://localhost:5173

# Adjust as needed
ACCESS_TOKEN_EXPIRE_MINUTES=30
RATE_LIMIT_PER_MINUTE=60
```

### Frontend Configuration (.env.local)

```env
# Point to backend on local network
VITE_API_URL=http://192.168.1.11:8000
```

---

## 🔒 Security Considerations

### Network Security

- ✅ Server computer is protected with password
- ✅ WiFi network has WPA2/WPA3 encryption
- ✅ Strong WiFi password
- ✅ Only authorized devices on network
- ✅ Regular backups of database

### Application Security

- ✅ Change default admin password immediately
- ✅ Use strong passwords for all accounts
- ✅ Regular security updates
- ✅ Monitor audit logs
- ✅ Limit admin access

### Backup Strategy

Regular backups are essential:

```cmd
# Windows - Manual backup
copy nursery-system\backend\nursery.db backups\nursery_backup_%date%.db

# Or use the built-in backup feature in the admin panel
```

---

## 🔍 Troubleshooting

### Problem: Can't Access from Other Devices

**Solutions:**

1. **Check Firewall**
   ```cmd
   Run: configure-firewall.bat (as Administrator)
   ```

2. **Verify Network Connection**
   - Both devices on same WiFi?
   - Try ping from other device:
     ```
     ping 192.168.1.11
     ```

3. **Check Server is Running**
   - Visit on server computer: `http://localhost:5173`
   - Check backend: `http://localhost:8000/docs`

4. **Verify IP Address**
   - Run `ipconfig` on server
   - Ensure you're using correct IP

### Problem: Server Stops Working

**Solutions:**

1. **Computer Went to Sleep**
   - Disable sleep mode:
     ```
     Control Panel → Power Options → Never
     ```

2. **Ports Already in Use**
   - Close existing instances
   - Or change ports in configuration

3. **Services Crashed**
   - Check backend window for errors
   - Check frontend window for errors
   - Restart: close windows and run start script again

### Problem: Slow Performance

**Solutions:**

1. **Check Server Resources**
   - Open Task Manager (Ctrl+Shift+Esc)
   - Verify CPU/RAM usage is reasonable

2. **Check Network**
   - Use Ethernet instead of WiFi for server
   - Move server closer to router
   - Reduce number of connected devices

3. **Check Database Size**
   - Large database? Consider cleanup
   - Archive old records

### Problem: Database Locked

**Solution:**
```cmd
# Close all connections
# Stop server
# Restart server
```

---

## 📈 Performance Optimization

### Server Computer

1. **Use Ethernet Connection**
   - More stable than WiFi
   - Better performance

2. **Close Unnecessary Applications**
   - Free up RAM and CPU

3. **Regular Maintenance**
   - Clean up disk space
   - Update Windows/OS
   - Restart weekly

### Network

1. **5GHz WiFi** (if available)
   - Faster than 2.4GHz
   - Less interference

2. **Quality of Service (QoS)**
   - Configure router to prioritize server traffic

3. **Network Monitoring**
   - Check for network congestion
   - Limit bandwidth-heavy activities during peak hours

---

## 📋 Daily Operations Checklist

### Morning (Server Operator)

- [ ] Verify server computer is running
- [ ] Check both windows (backend/frontend) are active
- [ ] Test access from your device
- [ ] Check for any error messages

### During the Day

- [ ] Monitor for issues reported by users
- [ ] Check server computer hasn't gone to sleep
- [ ] Verify network connection is stable

### Evening

- [ ] Optional: Create backup of database
- [ ] Server can remain running overnight
- [ ] Or shut down if preferred (restart next morning)

---

## 🔄 Updates and Maintenance

### Updating the Application

When new version available:

1. **Stop the server** (close both windows)
2. **Pull latest code**:
   ```cmd
   cd D:\nursy
   git pull origin main
   ```
3. **Update dependencies**:
   ```cmd
   cd nursery-system\backend
   venv\Scripts\activate
   pip install -r requirements.txt --upgrade

   cd ..\frontend
   npm install
   ```
4. **Restart server**: Run start-local-server.bat

### Database Backups

**Manual Backup:**
```cmd
copy nursery-system\backend\nursery.db backups\backup_%date%.db
```

**Automated Backup** (Windows Task Scheduler):
1. Open Task Scheduler
2. Create Basic Task
3. Set schedule (e.g., daily at 11 PM)
4. Action: Start a program
5. Program: `cmd`
6. Arguments: `/c copy "D:\nursy\nursery-system\backend\nursery.db" "D:\nursy\backups\backup_%date%.db"`

---

## 💰 Cost Comparison

| Aspect | Local Network | Cloud Hosting |
|--------|---------------|---------------|
| **Initial Cost** | $0 (use existing PC) | $0-5/month |
| **Monthly Cost** | Electricity (~$5) | $5-50/month |
| **Maintenance** | Manual | Automated |
| **Internet Required** | No | Yes |
| **Remote Access** | No | Yes |
| **Scalability** | Limited | Unlimited |
| **Data Privacy** | Highest | Depends |

**Recommendation**: Local network is perfect for small nurseries with 1-2 locations on the same network.

---

## 🆙 When to Upgrade to Cloud

Consider cloud hosting when:

- ✅ Multiple physical locations
- ✅ Need remote access (from home, etc.)
- ✅ Want automatic backups
- ✅ Need 24/7 availability
- ✅ Want automatic updates
- ✅ Growing user base (50+ users)

See [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md) for cloud deployment options.

---

## 📞 Support

### Local Network Issues

- Check Windows/OS firewall
- Verify network configuration
- Test with other applications
- Contact IT support if available

### Application Issues

- Check application logs
- See troubleshooting section
- Create GitHub issue
- Email: support@yourdomain.com

---

## 📝 Quick Reference

### Important Files

- `start-local-server.bat` - Start server (Windows)
- `start-local-server.sh` - Start server (Unix/Linux/Mac)
- `configure-firewall.bat` - Configure Windows Firewall
- `backend/.env.local` - Backend configuration
- `frontend/.env.local` - Frontend configuration
- `backend/nursery.db` - Database file (BACKUP THIS!)

### Important URLs

- **Application**: `http://[YOUR-IP]:5173`
- **API Docs**: `http://[YOUR-IP]:8000/docs`
- **API**: `http://[YOUR-IP]:8000`

### Default Credentials

- **Email**: admin@nursery.com
- **Password**: Admin123!
- **⚠️ Change immediately after first login!**

---

**Your Local Network Server is Ready! 🎉**

Start the server and share the URL with your users!
