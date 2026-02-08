package de.qordio.app.dataservice.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class FileService {

    private static final Logger LOG = Logger.getLogger(FileService.class);

    @ConfigProperty(name = "app.upload.directory")
    String uploadDirectory;

    public String saveFile(FileUpload file, String subfolder) throws IOException {
        String originalFileName = file.fileName();
        String extension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            extension = originalFileName.substring(i);
        }
        String uniqueFileName = UUID.randomUUID().toString() + extension;

        Path targetSubfolderPath = Paths.get(uploadDirectory, subfolder);
        Files.createDirectories(targetSubfolderPath);

        Path destinationPath = targetSubfolderPath.resolve(uniqueFileName);

        try (InputStream fileInputStream = Files.newInputStream(file.uploadedFile())) {
            Files.copy(fileInputStream, destinationPath, StandardCopyOption.REPLACE_EXISTING);
            LOG.infof("File %s saved to %s", originalFileName, destinationPath);
            // Return the public-facing path for the database
            return "/uploads/" + subfolder + "/" + uniqueFileName;
        } finally {
             try {
                Files.deleteIfExists(file.uploadedFile());
            } catch (IOException e) {
                LOG.warnf(e, "Could not delete temporary uploaded file: %s", file.uploadedFile().toString());
            }
        }
    }

    public void deleteFile(String publicFilePath) {
        if (publicFilePath == null || publicFilePath.isBlank() || !publicFilePath.startsWith("/uploads/")) {
            LOG.warnf("Attempted to delete an invalid or empty file path: %s", publicFilePath);
            return;
        }

        // Convert public path like "/uploads/recipes/xyz.jpg" to absolute container path
        String relativePath = publicFilePath.substring("/uploads/".length());
        Path absolutePath = Paths.get(uploadDirectory, relativePath);

        try {
            if (Files.exists(absolutePath)) {
                Files.delete(absolutePath);
                LOG.infof("Successfully deleted file: %s", absolutePath);
            } else {
                LOG.warnf("File to delete not found at path: %s", absolutePath);
            }
        } catch (IOException e) {
            LOG.errorf(e, "Error deleting file: %s", absolutePath);
        }
    }
}