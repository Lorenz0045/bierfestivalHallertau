package de.qordio.app.dataservice.entity.content;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import de.qordio.app.dataservice.entity.AppUser;
import de.qordio.app.dataservice.entity.content.enums.ContentStatus;
import de.qordio.app.dataservice.entity.lookups.LookupContentType;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "content_items")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "content_type_value", discriminatorType = DiscriminatorType.STRING)
public class ContentItem extends PanacheEntityBase { // nicht mehr abstract

    @Id
    @GeneratedValue
    public UUID id;

    @Column(name = "title", nullable = false)
    public String title;

    @Column(name = "image_url")
    public String imageUrl;

    @Column(name = "preview_description", columnDefinition = "TEXT")
    public String previewDescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_type_id", nullable = false)
    public LookupContentType contentType;

    @Column(name = "like_count", nullable = false) 
    public int likeCount = 0;

    @OneToMany(mappedBy = "contentItem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY) 
    private List<ContentLike> likes = new ArrayList<>(); 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = true)
    public AppUser author;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    public ContentStatus status = ContentStatus.PRIVATE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    public OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public OffsetDateTime updatedAt;

    public List<ContentLike> getLikes() {
        return likes;
    }
}