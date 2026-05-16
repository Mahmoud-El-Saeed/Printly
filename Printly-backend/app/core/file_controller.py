import os
import aiofiles
from fastapi import UploadFile
import re


from .config import get_settings, Settings

settings: Settings = get_settings()


FILE_UPLOAD_FOLDER = settings.UPLOAD_FOLDER_NAME
ALLOWED_FILE_TYPES = settings.ALLOWED_FILE_TYPES
ALLOWED_FILE_EXTENSIONS = settings.ALLOWED_FILE_EXTENSIONS

TYPE_MIME_MAPPING = {}
for ext, mime in zip(ALLOWED_FILE_EXTENSIONS, ALLOWED_FILE_TYPES):
    TYPE_MIME_MAPPING[ext] = mime

MAX_FILE_SIZE = settings.MAX_FILE_SIZE

parent_dir = os.path.dirname(os.path.abspath(__file__))
for _ in range(2):
    parent_dir = os.path.dirname(parent_dir)
UPLOAD_FOLDER_PATH = os.path.join(parent_dir, FILE_UPLOAD_FOLDER)


class FileController:
    """Controller for handling file operations such as saving and deleting files."""
    def __init__(self):
        self.upload_folder_path = UPLOAD_FOLDER_PATH

    def if_folder_exists(self, folder_path) -> None:
        """Check if the folder exists, if not create it."""
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
    
    def file_exists(self, file_path) -> bool:
        """Check if the file exists at the given path."""
        return os.path.exists(file_path)

    def _clean_name(self, filename) -> str:
        """Clean the filename to prevent directory traversal and other issues."""
        return re.sub(r"[^\w\-_\. ]", "_", filename.strip())

    def return_file_path(self, tenant_id, filename) -> str:
        """Return the file path for the given tenant and filename."""
        self.if_folder_exists(self.upload_folder_path)
        tenant_name_cleaned = self._clean_name(tenant_id)
        tenant_folder = os.path.join(self.upload_folder_path, tenant_name_cleaned)
        self.if_folder_exists(tenant_folder)
        cleaned_filename = self._clean_name(filename)
        file_path = os.path.join(tenant_folder, cleaned_filename)
        return file_path
    
    def get_file_extension(self, filename) -> str:
        """Get the file extension from the filename."""
        return os.path.splitext(filename)[1].lower()
    
    def get_file_mime_type(self, filename) -> str:
        """Get the MIME type for the given filename."""
        extension = self.get_file_extension(filename)
        return TYPE_MIME_MAPPING.get(extension, "application/octet-stream")

    def verify_file_type(self, file_name, file_type) -> bool:
        """
        Verify if the file type is allowed.
        it take file connent type and compare it with the allowed file types in the settings.
        """
        extension = self.get_file_extension(file_name)
        if extension not in ALLOWED_FILE_EXTENSIONS:
            return False
        if file_type not in ALLOWED_FILE_TYPES :
            return False
        return True

    def verify_file_size(self, file_size) -> bool:
        """
        Verify if the file size is within the limit.
        it take the file size in bytes and
        compare it with the MAX_FILE_SIZE which is also in bytes.
        """
        return file_size <= MAX_FILE_SIZE
    
    async def save_file(self, file_path, file: UploadFile) -> int:
        """Save the uploaded file to the specified file path. Return the size of the saved file."""
        file_size = 0
        async with aiofiles.open(file_path, 'wb') as out_file:
            while chunk := await file.read(1024 * 1024):  
                await out_file.write(chunk)
                file_size += len(chunk)
        return file_size
    
    async def delete_file(self, file_path):
        """Delete the file at the specified file path."""
        if os.path.exists(file_path):
            os.remove(file_path)



if __name__ == "__main__":

    print(UPLOAD_FOLDER_PATH)  # yes this is the correct path to the uploads folder
