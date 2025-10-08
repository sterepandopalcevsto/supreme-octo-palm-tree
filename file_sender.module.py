"""
Внешний модуль: отправка файла через выбор чата.
API: open_share_dialog_and_send(plugin, file_path)
"""
from java import jclass, dynamic_proxy
from hook_utils import find_class
from client_utils import get_last_fragment
from ui.bulletin import BulletinHelper


def open_share_dialog_and_send(plugin, file_path: str):
    try:
        # Открываем выбор чатов, затем отправляем документ через SendMessagesHelper
        DialogsActivity = find_class("org.telegram.ui.DialogsActivity")
        Bundle = jclass("android.os.Bundle")
        File = jclass("java.io.File")
        SendMessagesHelper = jclass("org.telegram.messenger.SendMessagesHelper")
        ArrayList = jclass("java.util.ArrayList")
        MimeTypeMap = jclass("android.webkit.MimeTypeMap")
        ApplicationLoader = jclass("org.telegram.messenger.ApplicationLoader")

        fragment = get_last_fragment()
        if not fragment:
            BulletinHelper.show_error("Нет активного экрана")
            return

        args = Bundle()
        args.putBoolean("onlySelect", True)
        args.putBoolean("canSelectTopics", True)
        args.putInt("dialogsType", 3)

        dialogs_fragment = DialogsActivity(args)

        class Delegate(dynamic_proxy(DialogsActivity.DialogsActivityDelegate)):
            def didSelectDialogs(self, fragment1, dids, message_text, param, notify, scheduleDate, topicsFragment):
                try:
                    log("[MFS] didSelectDialogs called")
                    if dids.size() == 0:
                        log("[MFS] No dialogs selected")
                        return True
                    path = File(file_path)
                    log(f"[MFS] Sending file: {path.getAbsolutePath()}")
                    caption = None
                    # Определяем MIME по расширению
                    filename = path.getName()
                    mime = None
                    try:
                        if filename and "." in filename:
                            ext = filename.split(".")[-1].lower()
                            mtm = MimeTypeMap.getSingleton()
                            mime = mtm.getMimeTypeFromExtension(ext)
                    except Exception:
                        mime = None
                    if not mime:
                        # Текстовый по умолчанию для .txt, иначе бинарный
                        if filename.endswith('.txt'):
                            mime = "text/plain"
                        else:
                            mime = "application/octet-stream"

                    # Копируем файл во внешнее кеш‑хранилище (как в downloader)
                    try:
                        ext_cache_root = ApplicationLoader.applicationContext.getExternalCacheDir()
                        plugin_dir = File(ext_cache_root, "ModularSenderTemp")
                        if not plugin_dir.exists():
                            plugin_dir.mkdirs()
                        external_copy = File(plugin_dir, filename)
                        log(f"[MFS] Copying to external: {external_copy.getAbsolutePath()}")
                        with open(path.getAbsolutePath(), 'rb') as f_in, open(external_copy.getAbsolutePath(), 'wb') as f_out:
                            while True:
                                chunk = f_in.read(8192)
                                if not chunk:
                                    break
                                f_out.write(chunk)
                        send_path = external_copy.getAbsolutePath()
                    except Exception:
                        # Фолбэк — используем исходный путь
                        send_path = path.getAbsolutePath()
                    uris = None
                    def do_send():
                        try:
                            for i in range(dids.size()):
                                dialog = dids.get(i)
                                did = dialog.dialogId
                                log(f"[MFS] prepareSendingDocument -> did={did}")
                                # Используем одиночный API, как в downloader
                                SendMessagesHelper.prepareSendingDocument(
                                    fragment1.getAccountInstance(),
                                    send_path,
                                    send_path,
                                    None,
                                    caption,
                                    mime,
                                    did,
                                    None, None, None, None, None,
                                    True, 0, None, None, 0, False
                                )
                            fragment1.finishFragment()
                            log("[MFS] DialogsActivity finished after scheduling send")
                        except Exception as e:
                            BulletinHelper.show_error(str(e))
                            log(f"[MFS] Error in do_send: {str(e)}")

                    # Выполняем отправку на UI-потоке
                    run_on_ui_thread(do_send)
                except Exception as e:
                    BulletinHelper.show_error(str(e))
                    log(f"[MFS] Error in didSelectDialogs: {str(e)}")
                return True

            def canSelectStories(self):
                return False

        dialogs_fragment.setDelegate(Delegate())
        fragment.presentFragment(dialogs_fragment)
    except Exception as e:
        raise e
