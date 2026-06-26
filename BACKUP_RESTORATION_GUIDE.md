# Backup & Disaster Recovery Guide - CONSTRUSMART ERP

## Phase 4: Backup & Disaster Recovery

This document outlines the backup and disaster recovery procedures for the CONSTRUSMART ERP database.

---

## 1. Automated Backup Configuration (Phase 4.1)

### Supabase Dashboard Configuration

**Manual Steps Required:**

1. **Access Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your project (CONSTRUSMART ERP)

2. **Enable Automated Backups**
   - Go to **Settings** → **Database**
   - Scroll to **Backups** section
   - Enable **Automated backups** (included in Pro plan)
   - Set backup retention to **30 days**
   - Enable **Point-in-Time Recovery (PITR)** for critical tables

3. **Configure Backup Schedule**
   - Set daily backups at 2:00 AM (low-traffic hours)
   - Enable **Continuous Backup** for PITR (retains changes for 7 days)

4. **Verify Backup Configuration**
   - Check that backups are being created in the **Backups** tab
   - Verify backup size and timestamps
   - Test restore to a test environment

---

## 2. Backup Verification Script (Phase 4.2)

### Overview

The `verify-backups.cjs` script performs automated weekly backup integrity checks and validates database connectivity.

### Usage

```bash
# Run the verification script
node verify-backups.cjs

# Or using tsx
npx tsx verify-backups.cjs
```

### What It Checks

1. **Database Connection** - Verifies connectivity to Supabase
2. **Backup Settings** - Confirms database connectivity (manual verification required via Dashboard)
3. **Critical Tables** - Verifies all critical tables exist and have data
4. **Foreign Key Integrity** - Checks that foreign key columns exist

### Critical Tables Verified

- `erp_proyectos`
- `erp_empresas`
- `erp_usuarios`
- `erp_presupuestos`
- `erp_ordenes_compra`
- `erp_cuadros`
- `erp_avances`
- `erp_materials`
- `erp_clientes`
- `erp_proveedores`

### Output

The script generates:
- **Console output** with verification results
- **Log file**: `backup-verification.log`
- **JSON report**: `backup-verification-report.json`

### Scheduling (Optional)

To schedule weekly verification, add to your CI/CD pipeline or use a cron job:

```bash
# Add to package.json scripts
"verify:backups": "node verify-backups.cjs"

# Run weekly via cron (Linux/Mac)
0 2 * * 0 cd /path/to/project && node verify-backups.cjs
```

---

## 3. Backup Restoration Procedure

### 3.1 Restore from Automated Backup

**Prerequisites:**
- Supabase Dashboard access
- Project administrator permissions
- Target environment (staging or production)

**Steps:**

1. **Navigate to Backups**
   - Go to Supabase Dashboard → **Settings** → **Database** → **Backups**

2. **Select Backup**
   - Choose the backup to restore from
   - Verify the timestamp and size

3. **Initiate Restore**
   - Click **Restore** on the selected backup
   - Confirm the restore operation
   - Select target database (if using multiple environments)

4. **Monitor Restore Progress**
   - The restore process may take several minutes depending on database size
   - Monitor the progress indicator in the Dashboard

5. **Verify Restore**
   - Run the verification script: `node verify-backups.cjs`
   - Check critical tables for data integrity
   - Test application functionality

### 3.2 Point-in-Time Recovery (PITR)

**Use Case:** Restore to a specific point in time (e.g., before a data corruption event)

**Steps:**

1. **Navigate to PITR**
   - Go to Supabase Dashboard → **Settings** → **Database** → **Point-in-Time Recovery**

2. **Select Timestamp**
   - Choose the exact timestamp to restore to
   - PITR typically retains data for 7 days

3. **Initiate Recovery**
   - Click **Recover** at the selected timestamp
   - Confirm the recovery operation

4. **Verify Recovery**
   - Run verification script
   - Check data at the recovery point
   - Test application functionality

### 3.3 Restore from Local Backup (if available)

**If you have local SQL dumps:**

```bash
# Using Supabase CLI
supabase db reset

# Or restore from specific file
psql -h [db-host] -U [db-user] -d [db-name] -f backup.sql
```

---

## 4. Emergency Recovery Procedures

### 4.1 Critical Data Loss

**If critical data is lost:**

1. **Stop Application** - Prevent further data loss
2. **Assess Damage** - Identify affected tables and data
3. **Select Backup** - Choose the most recent backup before the loss
4. **Restore Backup** - Follow restoration procedure
5. **Verify Data** - Run verification script and manual checks
6. **Resume Operations** - Restart application after verification

### 4.2 Database Corruption

**If database is corrupted:**

1. **Identify Corruption** - Check error logs and database health
2. **Stop Writes** - Prevent further corruption
3. **Restore from Backup** - Use the last known good backup
4. **Replay Transactions** - If using PITR, replay transactions up to the corruption point
5. **Verify Integrity** - Run comprehensive checks
6. **Investigate Root Cause** - Determine why corruption occurred

### 4.3 Accidental Data Deletion

**If data was accidentally deleted:**

1. **Identify Deletion Time** - Find when the deletion occurred
2. **Use PITR** - Restore to just before the deletion
3. **Export Data** - Export the deleted data
4. **Restore Current State** - Restore to current state
5. **Re-import Data** - Import the exported deleted data
6. **Verify** - Ensure data is correctly restored

---

## 5. Backup Best Practices

### 5.1 Regular Verification

- Run `verify-backups.cjs` weekly
- Check backup logs for errors
- Verify backup sizes are reasonable
- Test restore to staging environment monthly

### 5.2 Monitoring

- Set up alerts for backup failures (via Supabase Dashboard)
- Monitor database size growth
- Track backup storage usage
- Review backup retention policy quarterly

### 5.3 Security

- Ensure backup encryption is enabled (default in Supabase)
- Restrict backup restoration access to administrators
- Use service role key for backup operations only
- Never commit backup credentials to version control

### 5.4 Documentation

- Document any custom backup procedures
- Keep this guide updated with any changes
- Record any restore operations performed
- Note any issues encountered during restores

---

## 6. Troubleshooting

### Issue: Backup verification fails

**Solution:**
- Check `.env` file for correct Supabase credentials
- Verify database connectivity via Supabase Dashboard
- Check if service role key has proper permissions
- Review error logs in `backup-verification.log`

### Issue: Restore operation fails

**Solution:**
- Verify you have administrator permissions
- Check if backup file is corrupted
- Ensure sufficient storage space
- Contact Supabase support if issue persists

### Issue: PITR not available

**Solution:**
- Verify PITR is enabled in Supabase Dashboard
- Check if you're within the PITR retention window (7 days)
- Upgrade to Pro plan if not already
- Contact Supabase support for assistance

### Issue: Database connection fails during verification

**Solution:**
- Check network connectivity
- Verify Supabase URL and credentials
- Check if database is paused (Supabase free tier)
- Review Supabase status page for outages

---

## 7. Contact Information

### Support Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Status**: https://status.supabase.com
- **Supabase Support**: https://supabase.com/support

### Internal Contacts

- **Database Administrator**: [Add contact]
- **DevOps Team**: [Add contact]
- **Emergency Contact**: [Add contact]

---

## 8. Checklist

### Pre-Deployment
- [ ] Automated backups enabled in Supabase Dashboard
- [ ] Backup retention set to 30 days
- [ ] PITR enabled for critical tables
- [ ] Backup verification script tested
- [ ] Restoration procedure documented

### Post-Deployment
- [ ] Verify backups are being created
- [ ] Run verification script weekly
- [ ] Test restore to staging monthly
- [ ] Monitor backup success rate
- [ ] Review backup retention policy quarterly

### Emergency
- [ ] Stop application if data loss detected
- [ ] Identify affected data
- [ ] Select appropriate backup
- [ ] Execute restore procedure
- [ ] Verify data integrity
- [ ] Document incident

---

## Appendix A: Environment Variables

Required in `.env` file:

```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note:** Use service role key for backup operations, not anon key.

---

## Appendix B: Script Configuration

Modify `verify-backups.cjs` to customize:

```javascript
const CONFIG = {
  criticalTables: [...],  // Add or remove tables
  minimumRecords: {...},  // Adjust minimum record counts
  logFile: '...',         // Change log file path
  alertThreshold: 24      // Adjust alert threshold in hours
};
```

---

**Last Updated:** 2026-06-26
**Version:** 1.0
**Status:** Active
