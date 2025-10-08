"""
Внешний модуль: создание локального файла.
API: create_file(plugin, file_name, file_text) -> абсолютный путь
"""
from java import jclass

def create_file(plugin, file_name: str, file_text: str) -> str:
    try:
        ApplicationLoader = jclass("org.telegram.messenger.ApplicationLoader")
        File = jclass("java.io.File")
        base_dir = ApplicationLoader.getFilesDirFixed()
        temp_dir = File(base_dir, "modular_sender")
        if not temp_dir.exists():
            temp_dir.mkdirs()
        target = File(temp_dir, file_name)
        # Пишем файл в UTF-8
        with open(target.getAbsolutePath(), "w", encoding="utf-8") as f:
            f.write(file_text or "")
        return target.getAbsolutePath()
    except Exception as e:
        # Пробрасываем исключение вверх, чтобы загрузчик показал пользователю ошибку
        raise e
