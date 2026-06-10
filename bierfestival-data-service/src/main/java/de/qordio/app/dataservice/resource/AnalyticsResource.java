package de.qordio.app.dataservice.resource;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import de.qordio.app.dataservice.entity.masterdata.Beer;
import de.qordio.app.dataservice.entity.masterdata.Brewery;
import de.qordio.app.dataservice.entity.masterdata.BusLine;
import de.qordio.app.dataservice.entity.masterdata.BusStop;
import de.qordio.app.dataservice.entity.masterdata.CraftMarket;
import de.qordio.app.dataservice.entity.masterdata.Event;
import de.qordio.app.dataservice.entity.masterdata.Facility;
import de.qordio.app.dataservice.entity.masterdata.Gastronomy;
import de.qordio.app.dataservice.entity.masterdata.Sponsor;
import de.qordio.app.dataservice.entity.masterdata.Stage;
import de.qordio.app.dataservice.entity.masterdata.Tavern;
import de.qordio.app.dataservice.entity.lookups.City;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/admin/analytics")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("admin")
@SecurityRequirement(name = "jwtAuth")
@Tag(name = "Analytics")
public class AnalyticsResource {

    @Inject
    EntityManager em;

    public static class BeerAnalyticsDto {
        public Long bierId;
        public String beerName;
        public String breweryName;
        public String cityName;
        public String districtName;
        public String beerTypeName;
        public Boolean isNonAlcoholic;
        public Double avgRating;
        public Long ratingCount;
        public Long drinkCount;
        public Long merklisteCount;
    }

    public static class MasterDataSummaryDto {
        public long breweriesCount;
        public long beersCount;
        public long tavernsCount;
        public long sponsorsCount;
        public long gastronomyCount;
        public long craftMarketsCount;
        public long stagesCount;
        public long eventsCount;
        public long facilitiesCount;
        public long busLinesCount;
        public long busStopsCount;
        public Map<String, Long> beersPerType = new HashMap<>();
        public long nonAlcoholicBeers;
        public long alcoholicBeers;
        public List<CityDistributionDto> cityDistributions = new ArrayList<>();
    }

    public static class CityDistributionDto {
        public Long cityId;
        public String cityName;
        public long breweriesCount;
        public long beersCount;
        public long sponsorsCount;
        public long gastronomyCount;
        public long craftMarketsCount;
    }

    public static class RatingDistributionDto {
        public int stars;
        public long count;
        public double percentage;
    }

    public static class BeerDetailAnalyticsDto extends BeerAnalyticsDto {
        public List<RatingDistributionDto> ratingDistribution = new ArrayList<>();
        public Double avgDrinksPerUser;
        public Integer rankAvgRating;
        public Integer rankRatingCount;
        public Integer rankDrinkCount;
    }

    public static class BreweryAnalyticsDto {
        public Long breweryId;
        public String breweryName;
        public List<BeerAnalyticsDto> beers = new ArrayList<>();
        public Double overallAvgRating;
        public Long totalRatingCount;
    }

    public static class TavernAnalyticsDto {
        public Long tavernId;
        public String tavernName;
        public List<BeerAnalyticsDto> beers = new ArrayList<>();
    }

    public static class CityAnalyticsDto {
        public Long cityId;
        public String cityName;
        public List<BeerAnalyticsDto> beers = new ArrayList<>();
        public List<BreweryAnalyticsDto> breweries = new ArrayList<>();
    }

    @GET
    @Path("/beers/overview")
    @Operation(summary = "Get overview analytics for all beers")
    public List<BeerAnalyticsDto> getBeersOverview() {
        return fetchBeerAnalytics(null);
    }

    @GET
    @Path("/beers/{id}")
    @Operation(summary = "Get detailed analytics for a specific beer")
    public Response getBeerDetail(@PathParam("id") Long id) {
        List<BeerAnalyticsDto> overviewList = fetchBeerAnalytics(id);
        if (overviewList.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        BeerAnalyticsDto overview = overviewList.get(0);

        BeerDetailAnalyticsDto detail = new BeerDetailAnalyticsDto();
        detail.bierId = overview.bierId;
        detail.beerName = overview.beerName;
        detail.breweryName = overview.breweryName;
        detail.cityName = overview.cityName;
        detail.districtName = overview.districtName;
        detail.beerTypeName = overview.beerTypeName;
        detail.isNonAlcoholic = overview.isNonAlcoholic;
        detail.avgRating = overview.avgRating;
        detail.ratingCount = overview.ratingCount;
        detail.drinkCount = overview.drinkCount;
        detail.merklisteCount = overview.merklisteCount;

        // Rating Distribution
        String ratingSql = "SELECT rating, COUNT(*) FROM user_beer_interaction WHERE beer_id = :beerId AND rating IS NOT NULL GROUP BY rating";
        Query ratingQuery = em.createNativeQuery(ratingSql);
        ratingQuery.setParameter("beerId", id);
        List<Object[]> ratingResults = ratingQuery.getResultList();
        
        long totalRatings = overview.ratingCount != null ? overview.ratingCount : 0;
        for (int i = 1; i <= 5; i++) {
            RatingDistributionDto rd = new RatingDistributionDto();
            rd.stars = i;
            rd.count = 0;
            rd.percentage = 0.0;
            for (Object[] row : ratingResults) {
                if (((Number) row[0]).intValue() == i) {
                    rd.count = ((Number) row[1]).longValue();
                    rd.percentage = totalRatings > 0 ? ((double) rd.count / totalRatings) * 100.0 : 0.0;
                    break;
                }
            }
            detail.ratingDistribution.add(rd);
        }

        // Avg drinks per user (only users who drank it)
        String avgDrinksSql = "SELECT AVG(drink_count) FROM (SELECT device_id, COUNT(*) as drink_count FROM user_drink_event WHERE beer_id = :beerId GROUP BY device_id) as sub";
        Query avgQuery = em.createNativeQuery(avgDrinksSql);
        avgQuery.setParameter("beerId", id);
        Object avgResult = avgQuery.getSingleResult();
        detail.avgDrinksPerUser = avgResult != null ? ((Number) avgResult).doubleValue() : 0.0;

        // Ranks
        // Fast way using simple counting where aggregate > current value
        detail.rankAvgRating = getRank("AVG(rating)", "user_beer_interaction", "rating IS NOT NULL", overview.avgRating, true);
        detail.rankRatingCount = getRank("COUNT(rating)", "user_beer_interaction", "rating IS NOT NULL", overview.ratingCount != null ? overview.ratingCount.doubleValue() : 0.0, false);
        detail.rankDrinkCount = getRank("COUNT(*)", "user_drink_event", "1=1", overview.drinkCount != null ? overview.drinkCount.doubleValue() : 0.0, false);

        return Response.ok(detail).build();
    }

    private Integer getRank(String aggExpr, String table, String whereClause, Double myVal, boolean isFloat) {
        if (myVal == null || myVal == 0) return null; // Unranked if 0
        String sql = "SELECT COUNT(*) FROM (SELECT beer_id, " + aggExpr + " as agg_val FROM " + table + " WHERE " + whereClause + " GROUP BY beer_id HAVING " + aggExpr + " > :myVal) sub";
        Query query = em.createNativeQuery(sql);
        query.setParameter("myVal", myVal);
        Number count = (Number) query.getSingleResult();
        return count.intValue() + 1;
    }

    @GET
    @Path("/breweries/{id}")
    @Operation(summary = "Get analytics for a specific brewery")
    public Response getBreweryAnalytics(@PathParam("id") Long id) {
        Brewery brewery = Brewery.findById(id);
        if (brewery == null) return Response.status(Response.Status.NOT_FOUND).build();

        BreweryAnalyticsDto dto = new BreweryAnalyticsDto();
        dto.breweryId = brewery.id;
        dto.breweryName = brewery.name;

        String filterSql = " AND b.brewery_id = :breweryId";
        dto.beers = fetchBeerAnalyticsByCustomWhere(filterSql, id, null);

        double sumAvg = 0;
        long totalRatings = 0;
        for (BeerAnalyticsDto b : dto.beers) {
            if (b.ratingCount > 0) {
                sumAvg += (b.avgRating * b.ratingCount);
                totalRatings += b.ratingCount;
            }
        }
        dto.totalRatingCount = totalRatings;
        dto.overallAvgRating = totalRatings > 0 ? sumAvg / totalRatings : 0.0;

        return Response.ok(dto).build();
    }

    @GET
    @Path("/taverns/{id}")
    @Operation(summary = "Get analytics for a specific tavern")
    public Response getTavernAnalytics(@PathParam("id") Long id) {
        Tavern tavern = Tavern.findById(id);
        if (tavern == null) return Response.status(Response.Status.NOT_FOUND).build();

        TavernAnalyticsDto dto = new TavernAnalyticsDto();
        dto.tavernId = tavern.id;
        dto.tavernName = tavern.name;

        String filterSql = " AND b.id IN (SELECT beer_id FROM tavern_beer WHERE tavern_id = :tavernId)";
        dto.beers = fetchBeerAnalyticsByCustomWhere(filterSql, null, id);

        return Response.ok(dto).build();
    }

    @GET
    @Path("/cities/{id}")
    @Operation(summary = "Get analytics for a specific city")
    public Response getCityAnalytics(@PathParam("id") Long id) {
        City city = City.findById(id);
        if (city == null) return Response.status(Response.Status.NOT_FOUND).build();

        CityAnalyticsDto dto = new CityAnalyticsDto();
        dto.cityId = city.id;
        dto.cityName = city.name;

        String filterSql = " AND br.city_id = :cityId";
        dto.beers = fetchBeerAnalyticsByCustomWhere(filterSql, id, null);

        List<Brewery> breweries = Brewery.list("city.id", id);
        for (Brewery br : breweries) {
            BreweryAnalyticsDto bDto = new BreweryAnalyticsDto();
            bDto.breweryId = br.id;
            bDto.breweryName = br.name;
            // filter beers manually from already fetched list
            bDto.beers = dto.beers.stream().filter(b -> b.breweryName.equals(br.name)).toList();
            double sumAvg = 0;
            long totalRatings = 0;
            for (BeerAnalyticsDto b : bDto.beers) {
                if (b.ratingCount > 0) {
                    sumAvg += (b.avgRating * b.ratingCount);
                    totalRatings += b.ratingCount;
                }
            }
            bDto.totalRatingCount = totalRatings;
            bDto.overallAvgRating = totalRatings > 0 ? sumAvg / totalRatings : 0.0;
            dto.breweries.add(bDto);
        }

        return Response.ok(dto).build();
    }

    @GET
    @Path("/master-data-summary")
    @Operation(summary = "Get overall master data summary")
    public MasterDataSummaryDto getMasterDataSummary() {
        MasterDataSummaryDto dto = new MasterDataSummaryDto();
        dto.breweriesCount = Brewery.count();
        dto.beersCount = Beer.count();
        dto.tavernsCount = Tavern.count();
        dto.sponsorsCount = Sponsor.count();
        dto.gastronomyCount = Gastronomy.count();
        dto.craftMarketsCount = CraftMarket.count();
        dto.stagesCount = Stage.count();
        dto.eventsCount = Event.count();
        dto.facilitiesCount = Facility.count();
        dto.busLinesCount = BusLine.count();
        dto.busStopsCount = BusStop.count();

        dto.nonAlcoholicBeers = Beer.count("isNonAlcoholic = true");
        dto.alcoholicBeers = dto.beersCount - dto.nonAlcoholicBeers;

        List<Object[]> beerTypes = em.createNativeQuery("SELECT bt.name, COUNT(b.id) FROM beer_type bt LEFT JOIN beer b ON b.beer_type_id = bt.id GROUP BY bt.name").getResultList();
        for (Object[] row : beerTypes) {
            dto.beersPerType.put((String) row[0], ((Number) row[1]).longValue());
        }

        List<City> cities = City.listAll();
        for (City city : cities) {
            CityDistributionDto cDto = new CityDistributionDto();
            cDto.cityId = city.id;
            cDto.cityName = city.name;
            cDto.breweriesCount = Brewery.count("city.id", city.id);
            // Beers of breweries in this city
            cDto.beersCount = ((Number) em.createNativeQuery("SELECT COUNT(*) FROM beer b JOIN brewery br ON b.brewery_id = br.id WHERE br.city_id = :cid").setParameter("cid", city.id).getSingleResult()).longValue();
            cDto.sponsorsCount = Sponsor.count("city.id", city.id);
            cDto.gastronomyCount = Gastronomy.count("city.id", city.id);
            cDto.craftMarketsCount = CraftMarket.count("city.id", city.id);
            dto.cityDistributions.add(cDto);
        }

        return dto;
    }

    private List<BeerAnalyticsDto> fetchBeerAnalytics(Long beerId) {
        String filter = beerId != null ? " AND b.id = :beerId " : "";
        return fetchBeerAnalyticsByCustomWhere(filter, beerId, null);
    }

    private List<BeerAnalyticsDto> fetchBeerAnalyticsByCustomWhere(String extraWhere, Long param1, Long param2) {
        String sql = """
            SELECT 
                b.id as bierId, 
                b.name as beerName, 
                br.name as breweryName, 
                c.name as cityName, 
                d.name as districtName, 
                bt.name as beerTypeName, 
                b.is_non_alcoholic as isNonAlcoholic,
                
                (SELECT AVG(rating) FROM user_beer_interaction ubi WHERE ubi.beer_id = b.id AND ubi.rating IS NOT NULL) as avgRating,
                (SELECT COUNT(rating) FROM user_beer_interaction ubi WHERE ubi.beer_id = b.id AND ubi.rating IS NOT NULL) as ratingCount,
                (SELECT COUNT(*) FROM user_drink_event ude WHERE ude.beer_id = b.id) as drinkCount,
                (SELECT COUNT(*) FROM user_beer_interaction ubi WHERE ubi.beer_id = b.id AND ubi.is_on_merkliste = true) as merklisteCount
                
            FROM beer b
            LEFT JOIN brewery br ON b.brewery_id = br.id
            LEFT JOIN city c ON br.city_id = c.id
            LEFT JOIN district d ON br.district_id = d.id
            LEFT JOIN beer_type bt ON b.beer_type_id = bt.id
            WHERE 1=1 
        """ + extraWhere;

        Query query = em.createNativeQuery(sql);
        if (param1 != null) {
            // parameter depends on context; heuristic parameter setting based on query
            if (extraWhere.contains(":beerId")) query.setParameter("beerId", param1);
            if (extraWhere.contains(":breweryId")) query.setParameter("breweryId", param1);
            if (extraWhere.contains(":cityId")) query.setParameter("cityId", param1);
        }
        if (param2 != null) {
            if (extraWhere.contains(":tavernId")) query.setParameter("tavernId", param2);
        }

        List<Object[]> results = query.getResultList();
        List<BeerAnalyticsDto> dtos = new ArrayList<>();
        
        for (Object[] row : results) {
            BeerAnalyticsDto dto = new BeerAnalyticsDto();
            dto.bierId = ((Number) row[0]).longValue();
            dto.beerName = (String) row[1];
            dto.breweryName = (String) row[2];
            dto.cityName = (String) row[3];
            dto.districtName = (String) row[4];
            dto.beerTypeName = (String) row[5];
            dto.isNonAlcoholic = (Boolean) row[6];
            
            dto.avgRating = row[7] != null ? ((Number) row[7]).doubleValue() : 0.0;
            dto.ratingCount = row[8] != null ? ((Number) row[8]).longValue() : 0L;
            dto.drinkCount = row[9] != null ? ((Number) row[9]).longValue() : 0L;
            dto.merklisteCount = row[10] != null ? ((Number) row[10]).longValue() : 0L;
            
            dtos.add(dto);
        }
        
        return dtos;
    }
}
