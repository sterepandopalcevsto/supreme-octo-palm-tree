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
                    if dids.size() == 0:
                        return True
                    path = File(file_path)
                    paths = ArrayList()
                    originals = ArrayList()
                    paths.add(path.getAbsolutePath())
                    originals.add(path.getAbsolutePath())
                    caption = None
                    mime = None
                    uris = None
                    for i in range(dids.size()):
                        dialog = dids.get(i)
                        did = dialog.dialogId
                        SendMessagesHelper.prepareSendingDocuments(
                            fragment1.getAccountInstance(), paths, originals, uris, caption, mime, did,
                            None, None, None, None, None, True, 0, None, None, 0, 0, False, 0
                        )
                    fragment1.finishFragment()
                except Exception as e:
                    BulletinHelper.show_error(str(e))
                return True

            def canSelectStories(self):
                return False

        dialogs_fragment.setDelegate(Delegate())
        fragment.presentFragment(dialogs_fragment)
    except Exception as e:
        raise e
