package de.qordio.app.dataservice.resource;

import java.io.IOException;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Encoding;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import de.qordio.app.dataservice.service.FileService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@jakarta.ws.rs.Path("/api/admin/uploads") 
@ApplicationScoped
@Tag(name = "File Upload (Admin)", description = "Handles file uploads for content images.")
public class FileUploadResource {

    private static final Logger LOG = Logger.getLogger(FileUploadResource.class);

    @Inject
    FileService fileService;

    public static class FileUploadRequest {
        @org.jboss.resteasy.reactive.RestForm("file") // Name des Formularfelds
        public FileUpload file;

        @org.jboss.resteasy.reactive.RestForm("subfolder") // Optional: z.B. "recipes", "users"
        public String subfolder;
    }

    public static class FileUploadResponse {
        public String filePath; // Relativer Pfad, der in der DB gespeichert wird, z.B. /uploads/recipes/bild.jpg
        public String fileName;

        public FileUploadResponse(String filePath, String fileName) {
            this.filePath = filePath;
            this.fileName = fileName;
        }
    }

    @POST
    @jakarta.ws.rs.Path("/image") 
    @RolesAllowed("admin") 
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Upload an image file", description = "Uploads an image to a specified subfolder within the configured upload directory.")
    @RequestBody(
        description = "Multipart form data containing the file and an optional subfolder.",
        required = true,
        content = @Content(
            mediaType = MediaType.MULTIPART_FORM_DATA,
            schema = @Schema(implementation = FileUploadRequest.class),
            encoding = {
                @Encoding(name = "file", contentType = "image/jpeg, image/png, image/gif, image/webp"),
                @Encoding(name = "subfolder", contentType = MediaType.TEXT_PLAIN)
            }
        )
    )
    @APIResponse(responseCode = "200", description = "File uploaded successfully", content = @Content(schema = @Schema(implementation = FileUploadResponse.class)))
    @APIResponse(responseCode = "400", description = "No file uploaded or invalid request")
    @APIResponse(responseCode = "500", description = "Internal server error during file upload")
    @SecurityRequirement(name = "jwtAuth")
    public Response uploadImage(FileUploadRequest request) {
        if (request.file == null || request.file.fileName() == null || request.file.fileName().isEmpty()) {
            LOG.warn("Upload attempt with no file or no filename.");
            return Response.status(Response.Status.BAD_REQUEST).entity("No file uploaded or filename is missing.").build();
        }

        FileUpload uploadedFile = request.file;
        String subfolder = (request.subfolder != null && !request.subfolder.trim().isEmpty()) ? request.subfolder.trim() : "images";

        try {
            String publicFilePath = fileService.saveFile(uploadedFile, subfolder);
            return Response.ok(new FileUploadResponse(publicFilePath, uploadedFile.fileName())).build();
        } catch (IOException e) {
            LOG.errorf(e, "Error saving uploaded image file.");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Error saving file.").build();
        }
    }

    @POST
    @jakarta.ws.rs.Path("/video")
    @RolesAllowed("admin")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Upload a video file")
    @SecurityRequirement(name = "jwtAuth")
    public Response uploadVideo(FileUploadRequest request) {
        if (request.file == null || request.file.fileName() == null || request.file.fileName().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity("No file uploaded.").build();
        }

        FileUpload uploadedFile = request.file;
        String subfolder = (request.subfolder != null && !request.subfolder.trim().isEmpty()) ? request.subfolder.trim() : "videos";

        try {
            String publicFilePath = fileService.saveFile(uploadedFile, subfolder);
            return Response.ok(new FileUploadResponse(publicFilePath, uploadedFile.fileName())).build();
        } catch (IOException e) {
            LOG.errorf(e, "Error saving uploaded video file.");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Error saving file.").build();
        }
    }
}