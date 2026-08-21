package com.securevault.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;
import androidx.core.content.FileProvider;
import androidx.core.content.pm.PackageInfoCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

    @PluginMethod
    public void getAppVersion(PluginCall call) {
        try {
            Context context = getContext();
            PackageManager pm = context.getPackageManager();
            PackageInfo pInfo = pm.getPackageInfo(context.getPackageName(), 0);

            long versionCode = PackageInfoCompat.getLongVersionCode(pInfo);
            String versionName = pInfo.versionName != null ? pInfo.versionName : "1.0";

            JSObject ret = new JSObject();
            ret.put("appId", context.getPackageName());
            ret.put("versionCode", versionCode);
            ret.put("versionName", versionName);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to retrieve package information: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        try {
            Context context = getContext();
            boolean canInstall = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                canInstall = context.getPackageManager().canRequestPackageInstalls();
            }
            JSObject ret = new JSObject();
            ret.put("canInstall", canInstall);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to check install permissions: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            Context context = getContext();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
            call.resolve(new JSObject().put("opened", true));
        } catch (Exception e) {
            call.reject("Failed to open install settings: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void saveAndInstallApk(PluginCall call) {
        try {
            String base64Data = call.getString("base64Data");
            if (base64Data == null || base64Data.trim().isEmpty()) {
                call.reject("No APK data provided for installation.");
                return;
            }

            Context context = getContext();
            File updatesDir = new File(context.getCacheDir(), "updates");
            if (!updatesDir.exists()) {
                updatesDir.mkdirs();
            }

            File apkFile = new File(updatesDir, "SecureVault-update.apk");
            if (apkFile.exists()) {
                apkFile.delete();
            }

            byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
            try (FileOutputStream fos = new FileOutputStream(apkFile)) {
                fos.write(decodedBytes);
                fos.flush();
            }

            Uri apkUri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                apkFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            context.startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("path", apkFile.getAbsolutePath());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to launch package installation: " + e.getMessage(), e);
        }
    }
}
