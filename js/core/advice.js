// Pure rules about what to show right now.
export const DIFFICULT_MISSES = 2;
const BACKUP_DAYS = 14;

export const needsBackup = ({ answers, lastBackup, now = Date.now() }) =>
    answers >= 50 && (!lastBackup || now - lastBackup > BACKUP_DAYS * 86400000);
