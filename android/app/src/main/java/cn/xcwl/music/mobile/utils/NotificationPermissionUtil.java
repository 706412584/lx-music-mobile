package cn.xcwl.music.mobile.utils;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.core.app.NotificationManagerCompat;

import java.util.List;

public class NotificationPermissionUtil {

  /** 检查通知权限是否开�?*/
  public static boolean isNotificationsEnabled(Context context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      // Android 8.0 及以�?
      NotificationManager manager =
        (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
      if (manager == null) return false;

      if (!manager.areNotificationsEnabled()) {
        return false;
      }

      // 检查每个通知通道
      try {
        List<NotificationChannel> channels = manager.getNotificationChannels();
        if (channels != null) {
          for (NotificationChannel channel : channels) {
            if (channel.getImportance() == NotificationManager.IMPORTANCE_NONE) {
              return false;
            }
          }
        }
      } catch (Exception e) {
        Log.w("NotificationUtil", "Error reading notification channels", e);
      }

      return true;
    } else {
      // Android 5.1 - 7.1
      return NotificationManagerCompat.from(context).areNotificationsEnabled();
    }
  }

  /** 安全地打开通知设置�?*/
  public static boolean openNotificationPermissionActivity(Context context) {
    String packageName = context.getPackageName();
    Intent intent = new Intent();

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      // Android 8.0 及以�?
      intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
      intent.putExtra("android.provider.extra.APP_PACKAGE", packageName);
    } else {
      // Android 5.1 - 7.1
      intent.setAction("android.settings.APP_NOTIFICATION_SETTINGS");
      intent.putExtra("app_package", packageName);
      intent.putExtra("app_uid", context.getApplicationInfo().uid);
    }

    // 加上 NEW_TASK 标志，确保从�?Activity Context 启动不会崩溃
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

    // 检查系统是否支持该 Intent（防止某�?ROM 无响应导致卡死）
    PackageManager pm = context.getPackageManager();
    List<ResolveInfo> infos = pm.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
    if (infos.isEmpty()) {
      Log.w("NotificationUtil", "No activity found to handle notification settings intent");
      return false;
    }

    try {
      context.startActivity(intent);
      return true;
    } catch (Exception e) {
      Log.e("NotificationUtil", "Failed to start notification settings", e);
      return false;
    }
  }
}
