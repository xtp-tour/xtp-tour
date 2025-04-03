// Code generated by BobGen mysql v0.31.0. DO NOT EDIT.
// This file is meant to be re-generated in place and/or deleted at any time.

package factory

import (
	"context"
	"testing"

	"github.com/aarondl/opt/omit"
	"github.com/jaswdr/faker/v2"
	"github.com/stephenafamo/bob"
	models "github.com/xtp-tour/xtp-tour/api/pkg/db/models"
)

type FacilityPartnerCardMod interface {
	Apply(*FacilityPartnerCardTemplate)
}

type FacilityPartnerCardModFunc func(*FacilityPartnerCardTemplate)

func (f FacilityPartnerCardModFunc) Apply(n *FacilityPartnerCardTemplate) {
	f(n)
}

type FacilityPartnerCardModSlice []FacilityPartnerCardMod

func (mods FacilityPartnerCardModSlice) Apply(n *FacilityPartnerCardTemplate) {
	for _, f := range mods {
		f.Apply(n)
	}
}

// FacilityPartnerCardTemplate is an object representing the database table.
// all columns are optional and should be set by mods
type FacilityPartnerCardTemplate struct {
	FacilityID    func() string
	PartnerCardID func() string

	r facilityPartnerCardR
	f *Factory
}

type facilityPartnerCardR struct {
	Facility    *facilityPartnerCardRFacilityR
	PartnerCard *facilityPartnerCardRPartnerCardR
}

type facilityPartnerCardRFacilityR struct {
	o *FacilityTemplate
}
type facilityPartnerCardRPartnerCardR struct {
	o *PartnerCardTemplate
}

// Apply mods to the FacilityPartnerCardTemplate
func (o *FacilityPartnerCardTemplate) Apply(mods ...FacilityPartnerCardMod) {
	for _, mod := range mods {
		mod.Apply(o)
	}
}

// toModel returns an *models.FacilityPartnerCard
// this does nothing with the relationship templates
func (o FacilityPartnerCardTemplate) toModel() *models.FacilityPartnerCard {
	m := &models.FacilityPartnerCard{}

	if o.FacilityID != nil {
		m.FacilityID = o.FacilityID()
	}
	if o.PartnerCardID != nil {
		m.PartnerCardID = o.PartnerCardID()
	}

	return m
}

// toModels returns an models.FacilityPartnerCardSlice
// this does nothing with the relationship templates
func (o FacilityPartnerCardTemplate) toModels(number int) models.FacilityPartnerCardSlice {
	m := make(models.FacilityPartnerCardSlice, number)

	for i := range m {
		m[i] = o.toModel()
	}

	return m
}

// setModelRels creates and sets the relationships on *models.FacilityPartnerCard
// according to the relationships in the template. Nothing is inserted into the db
func (t FacilityPartnerCardTemplate) setModelRels(o *models.FacilityPartnerCard) {
	if t.r.Facility != nil {
		rel := t.r.Facility.o.toModel()
		o.FacilityID = rel.ID
		o.R.Facility = rel
	}

	if t.r.PartnerCard != nil {
		rel := t.r.PartnerCard.o.toModel()
		o.PartnerCardID = rel.ID
		o.R.PartnerCard = rel
	}
}

// BuildSetter returns an *models.FacilityPartnerCardSetter
// this does nothing with the relationship templates
func (o FacilityPartnerCardTemplate) BuildSetter() *models.FacilityPartnerCardSetter {
	m := &models.FacilityPartnerCardSetter{}

	if o.FacilityID != nil {
		m.FacilityID = omit.From(o.FacilityID())
	}
	if o.PartnerCardID != nil {
		m.PartnerCardID = omit.From(o.PartnerCardID())
	}

	return m
}

// BuildManySetter returns an []*models.FacilityPartnerCardSetter
// this does nothing with the relationship templates
func (o FacilityPartnerCardTemplate) BuildManySetter(number int) []*models.FacilityPartnerCardSetter {
	m := make([]*models.FacilityPartnerCardSetter, number)

	for i := range m {
		m[i] = o.BuildSetter()
	}

	return m
}

// Build returns an *models.FacilityPartnerCard
// Related objects are also created and placed in the .R field
// NOTE: Objects are not inserted into the database. Use FacilityPartnerCardTemplate.Create
func (o FacilityPartnerCardTemplate) Build() *models.FacilityPartnerCard {
	m := o.toModel()
	o.setModelRels(m)

	return m
}

// BuildMany returns an models.FacilityPartnerCardSlice
// Related objects are also created and placed in the .R field
// NOTE: Objects are not inserted into the database. Use FacilityPartnerCardTemplate.CreateMany
func (o FacilityPartnerCardTemplate) BuildMany(number int) models.FacilityPartnerCardSlice {
	m := make(models.FacilityPartnerCardSlice, number)

	for i := range m {
		m[i] = o.Build()
	}

	return m
}

func ensureCreatableFacilityPartnerCard(m *models.FacilityPartnerCardSetter) {
	if m.FacilityID.IsUnset() {
		m.FacilityID = omit.From(random_string(nil))
	}
	if m.PartnerCardID.IsUnset() {
		m.PartnerCardID = omit.From(random_string(nil))
	}
}

// insertOptRels creates and inserts any optional the relationships on *models.FacilityPartnerCard
// according to the relationships in the template.
// any required relationship should have already exist on the model
func (o *FacilityPartnerCardTemplate) insertOptRels(ctx context.Context, exec bob.Executor, m *models.FacilityPartnerCard) (context.Context, error) {
	var err error

	return ctx, err
}

// Create builds a facilityPartnerCard and inserts it into the database
// Relations objects are also inserted and placed in the .R field
func (o *FacilityPartnerCardTemplate) Create(ctx context.Context, exec bob.Executor) (*models.FacilityPartnerCard, error) {
	_, m, err := o.create(ctx, exec)
	return m, err
}

// MustCreate builds a facilityPartnerCard and inserts it into the database
// Relations objects are also inserted and placed in the .R field
// panics if an error occurs
func (o *FacilityPartnerCardTemplate) MustCreate(ctx context.Context, exec bob.Executor) *models.FacilityPartnerCard {
	_, m, err := o.create(ctx, exec)
	if err != nil {
		panic(err)
	}
	return m
}

// CreateOrFail builds a facilityPartnerCard and inserts it into the database
// Relations objects are also inserted and placed in the .R field
// It calls `tb.Fatal(err)` on the test/benchmark if an error occurs
func (o *FacilityPartnerCardTemplate) CreateOrFail(ctx context.Context, tb testing.TB, exec bob.Executor) *models.FacilityPartnerCard {
	tb.Helper()
	_, m, err := o.create(ctx, exec)
	if err != nil {
		tb.Fatal(err)
		return nil
	}
	return m
}

// create builds a facilityPartnerCard and inserts it into the database
// Relations objects are also inserted and placed in the .R field
// this returns a context that includes the newly inserted model
func (o *FacilityPartnerCardTemplate) create(ctx context.Context, exec bob.Executor) (context.Context, *models.FacilityPartnerCard, error) {
	var err error
	opt := o.BuildSetter()
	ensureCreatableFacilityPartnerCard(opt)

	var rel0 *models.Facility
	if o.r.Facility == nil {
		var ok bool
		rel0, ok = facilityCtx.Value(ctx)
		if !ok {
			FacilityPartnerCardMods.WithNewFacility().Apply(o)
		}
	}
	if o.r.Facility != nil {
		ctx, rel0, err = o.r.Facility.o.create(ctx, exec)
		if err != nil {
			return ctx, nil, err
		}
	}
	opt.FacilityID = omit.From(rel0.ID)

	var rel1 *models.PartnerCard
	if o.r.PartnerCard == nil {
		var ok bool
		rel1, ok = partnerCardCtx.Value(ctx)
		if !ok {
			FacilityPartnerCardMods.WithNewPartnerCard().Apply(o)
		}
	}
	if o.r.PartnerCard != nil {
		ctx, rel1, err = o.r.PartnerCard.o.create(ctx, exec)
		if err != nil {
			return ctx, nil, err
		}
	}
	opt.PartnerCardID = omit.From(rel1.ID)

	m, err := models.FacilityPartnerCards.Insert(opt).One(ctx, exec)
	if err != nil {
		return ctx, nil, err
	}
	ctx = facilityPartnerCardCtx.WithValue(ctx, m)

	m.R.Facility = rel0
	m.R.PartnerCard = rel1

	ctx, err = o.insertOptRels(ctx, exec, m)
	return ctx, m, err
}

// CreateMany builds multiple facilityPartnerCards and inserts them into the database
// Relations objects are also inserted and placed in the .R field
func (o FacilityPartnerCardTemplate) CreateMany(ctx context.Context, exec bob.Executor, number int) (models.FacilityPartnerCardSlice, error) {
	_, m, err := o.createMany(ctx, exec, number)
	return m, err
}

// MustCreateMany builds multiple facilityPartnerCards and inserts them into the database
// Relations objects are also inserted and placed in the .R field
// panics if an error occurs
func (o FacilityPartnerCardTemplate) MustCreateMany(ctx context.Context, exec bob.Executor, number int) models.FacilityPartnerCardSlice {
	_, m, err := o.createMany(ctx, exec, number)
	if err != nil {
		panic(err)
	}
	return m
}

// CreateManyOrFail builds multiple facilityPartnerCards and inserts them into the database
// Relations objects are also inserted and placed in the .R field
// It calls `tb.Fatal(err)` on the test/benchmark if an error occurs
func (o FacilityPartnerCardTemplate) CreateManyOrFail(ctx context.Context, tb testing.TB, exec bob.Executor, number int) models.FacilityPartnerCardSlice {
	tb.Helper()
	_, m, err := o.createMany(ctx, exec, number)
	if err != nil {
		tb.Fatal(err)
		return nil
	}
	return m
}

// createMany builds multiple facilityPartnerCards and inserts them into the database
// Relations objects are also inserted and placed in the .R field
// this returns a context that includes the newly inserted models
func (o FacilityPartnerCardTemplate) createMany(ctx context.Context, exec bob.Executor, number int) (context.Context, models.FacilityPartnerCardSlice, error) {
	var err error
	m := make(models.FacilityPartnerCardSlice, number)

	for i := range m {
		ctx, m[i], err = o.create(ctx, exec)
		if err != nil {
			return ctx, nil, err
		}
	}

	return ctx, m, nil
}

// FacilityPartnerCard has methods that act as mods for the FacilityPartnerCardTemplate
var FacilityPartnerCardMods facilityPartnerCardMods

type facilityPartnerCardMods struct{}

func (m facilityPartnerCardMods) RandomizeAllColumns(f *faker.Faker) FacilityPartnerCardMod {
	return FacilityPartnerCardModSlice{
		FacilityPartnerCardMods.RandomFacilityID(f),
		FacilityPartnerCardMods.RandomPartnerCardID(f),
	}
}

// Set the model columns to this value
func (m facilityPartnerCardMods) FacilityID(val string) FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.FacilityID = func() string { return val }
	})
}

// Set the Column from the function
func (m facilityPartnerCardMods) FacilityIDFunc(f func() string) FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.FacilityID = f
	})
}

// Clear any values for the column
func (m facilityPartnerCardMods) UnsetFacilityID() FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.FacilityID = nil
	})
}

// Generates a random value for the column using the given faker
// if faker is nil, a default faker is used
func (m facilityPartnerCardMods) RandomFacilityID(f *faker.Faker) FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.FacilityID = func() string {
			return random_string(f)
		}
	})
}

// Set the model columns to this value
func (m facilityPartnerCardMods) PartnerCardID(val string) FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.PartnerCardID = func() string { return val }
	})
}

// Set the Column from the function
func (m facilityPartnerCardMods) PartnerCardIDFunc(f func() string) FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.PartnerCardID = f
	})
}

// Clear any values for the column
func (m facilityPartnerCardMods) UnsetPartnerCardID() FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.PartnerCardID = nil
	})
}

// Generates a random value for the column using the given faker
// if faker is nil, a default faker is used
func (m facilityPartnerCardMods) RandomPartnerCardID(f *faker.Faker) FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.PartnerCardID = func() string {
			return random_string(f)
		}
	})
}

func (m facilityPartnerCardMods) WithFacility(rel *FacilityTemplate) FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.r.Facility = &facilityPartnerCardRFacilityR{
			o: rel,
		}
	})
}

func (m facilityPartnerCardMods) WithNewFacility(mods ...FacilityMod) FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		related := o.f.NewFacility(mods...)

		m.WithFacility(related).Apply(o)
	})
}

func (m facilityPartnerCardMods) WithoutFacility() FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.r.Facility = nil
	})
}

func (m facilityPartnerCardMods) WithPartnerCard(rel *PartnerCardTemplate) FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.r.PartnerCard = &facilityPartnerCardRPartnerCardR{
			o: rel,
		}
	})
}

func (m facilityPartnerCardMods) WithNewPartnerCard(mods ...PartnerCardMod) FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		related := o.f.NewPartnerCard(mods...)

		m.WithPartnerCard(related).Apply(o)
	})
}

func (m facilityPartnerCardMods) WithoutPartnerCard() FacilityPartnerCardMod {
	return FacilityPartnerCardModFunc(func(o *FacilityPartnerCardTemplate) {
		o.r.PartnerCard = nil
	})
}
